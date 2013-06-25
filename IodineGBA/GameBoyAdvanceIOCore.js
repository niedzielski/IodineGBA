"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function GameBoyAdvanceIO(emulatorCore) {
	//Reference to the emulator core:
	this.emulatorCore = emulatorCore;
	//State Machine Tracking:
	this.systemStatus = 0;
	this.cyclesToIterate = 0;
	this.cyclesIteratedPreviously = 0;
    this.BIOSFound = false;
    //Initialize the various handler objects:
	this.memory = new GameBoyAdvanceMemory(this);
    this.dma = new GameBoyAdvanceDMA(this);
	this.gfx = new GameBoyAdvanceGraphics(this);
	this.sound = new GameBoyAdvanceSound(this);
	this.timer = new GameBoyAdvanceTimer(this);
	this.irq = new GameBoyAdvanceIRQ(this);
	this.serial = new GameBoyAdvanceSerial(this);
	this.joypad = new GameBoyAdvanceJoyPad(this);
	this.cartridge = new GameBoyAdvanceCartridge(this);
	this.wait = new GameBoyAdvanceWait(this);
	this.cpu = new GameBoyAdvanceCPU(this);
    this.memory.loadReferences();
}
GameBoyAdvanceIO.prototype.iterate = function () {
	//Find out how many clocks to iterate through this run:
	this.cyclesToIterate = ((this.emulatorCore.CPUCyclesTotal | 0) - (this.cyclesIteratedPreviously | 0)) | 0;
	//If clocks remaining, run iterator:
	this.runIterator();
	//Ensure audio buffers at least once per iteration:
	this.sound.audioJIT();
	//If we clocked just a little too much, subtract the extra from the next run:
	this.cyclesIteratedPreviously = this.cyclesToIterate | 0;
}
GameBoyAdvanceIO.prototype.runIterator = function () {
	//Clock through interpreter:
	while ((this.cyclesToIterate | 0) > 0) {
		if ((this.systemStatus | 0) > 0) {
			//Handle HALT/STOP/DMA here:
			this.handleCPUStallEvents();
		}
		else {
			//Execute next instruction:
			this.cpu.executeIteration();
		}
	}
}
GameBoyAdvanceIO.prototype.updateCore = function (clocks) {
	clocks = clocks | 0;
    //This is used during normal/dma modes of operation:
	//Decrement the clocks per iteration counter:
	this.cyclesToIterate -= clocks | 0;
	//Clock all components:
	this.gfx.addClocks(clocks | 0);
	this.timer.addClocks(clocks | 0);
    this.serial.addClocks(clocks | 0);
}
GameBoyAdvanceIO.prototype.handleCPUStallEvents = function () {
	switch (this.systemStatus | 0) {
		case 1:	//DMA Handle State
			this.handleDMA();
			break;
		case 2: //Handle Halt State
			this.handleHalt();
			break;
		case 3: //DMA Inside Halt State
			this.handleDMA();
			break;
		case 4: //Handle Stop State
			this.handleStop();
            /*break;
        case 5: //LLE Dynarec JIT
            this.handleDynarec();*/
	}
}
GameBoyAdvanceIO.prototype.handleDMA = function () {
	if (this.dma.perform()) {
		//If DMA is done, exit it:
		this.systemStatus = ((this.systemStatus | 0) - 0x1) | 0;
	}
}
GameBoyAdvanceIO.prototype.handleHalt = function () {
	if (!this.irq.IRQMatch()) {
		//Clock up to next IRQ match or DMA:
		var clocks = this.irq.nextEventTime() | 0;
		var dmaClocks = this.dma.nextEventTime() | 0;
		clocks = ((clocks > -1) ? ((dmaClocks > -1) ? Math.min(clocks | 0, dmaClocks | 0) : (clocks | 0)) : (dmaClocks | 0)) | 0;
		this.updateCore(((clocks == -1 || clocks > this.cyclesToIterate) ? (this.cyclesToIterate | 0) : (clocks | 0)) | 0);
	}
	else {
		//Exit HALT promptly:
		this.systemStatus = ((this.systemStatus | 0) - 0x2) | 0;
	}
}
GameBoyAdvanceIO.prototype.handleStop = function () {
	//Update sound system to add silence to buffer:
	this.sound.addClocks(this.cyclesToIterate | 0);
	this.cyclesToIterate = 0;
	//Exits when user presses joypad or from an external irq outside of GBA internal.
}
/*GameBoyAdvanceIO.prototype.handleDynarec = function () {
	if (this.emulatorCore.dynarecEnabled) {
		this.cpu.dynarec.enter();
	}
}*/