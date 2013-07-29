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
    this.executeDynarec = false;
	this.cyclesToIterate = 0;
	this.cyclesIteratedPreviously = 0;
    this.accumulatedClocks = 0;
    this.nextEventClocks = 0;
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
    this.preprocessSystemStepper();
}
GameBoyAdvanceIO.prototype.iterate = function () {
	//Find out how many clocks to iterate through this run:
	this.cyclesToIterate = ((this.emulatorCore.CPUCyclesTotal | 0) - (this.cyclesIteratedPreviously | 0)) | 0;
	//Update our core event prediction:
    this.updateCoreEventTime();
    //If clocks remaining, run iterator:
	this.runIterator();
    //Spill our core event clocking:
    this.updateCoreClocking();
	//Ensure audio buffers at least once per iteration:
	this.sound.audioJIT();
	//If we clocked just a little too much, subtract the extra from the next run:
	this.cyclesIteratedPreviously = this.cyclesToIterate | 0;
}
GameBoyAdvanceIO.prototype.runIterator = function () {
	//Clock through the state machine:
	while ((this.cyclesToIterate | 0) > 0) {
		//Handle the current system state selected:
        this.stepHandle();
	}
}
GameBoyAdvanceIO.prototype.updateCore = function (clocks) {
	clocks = clocks | 0;
    //This is used during normal/dma modes of operation:
    this.accumulatedClocks = ((this.accumulatedClocks | 0) + (clocks | 0)) | 0;
    if ((this.accumulatedClocks | 0) >= (this.nextEventClocks | 0)) {
        this.updateCoreSpill();
    }
}
GameBoyAdvanceIO.prototype.updateCoreSpill = function () {
    this.updateCoreClocking();
    this.updateCoreEventTime();
}
GameBoyAdvanceIO.prototype.updateCoreClocking = function () {
    var clocks = this.accumulatedClocks | 0;
    //Decrement the clocks per iteration counter:
    this.cyclesToIterate = ((this.cyclesToIterate | 0) - (clocks | 0)) | 0;
    //Clock all components:
    this.gfx.addClocks(clocks | 0);
    this.timer.addClocks(clocks | 0);
    this.serial.addClocks(clocks | 0);
    this.accumulatedClocks = 0;
}
GameBoyAdvanceIO.prototype.updateCoreEventTime = function () {
    this.nextEventClocks = this.cyclesUntilNextEvent() | 0;
}
GameBoyAdvanceIO.prototype.preprocessSystemStepper = function () {
	switch (this.systemStatus | 0) {
		case 0: //CPU Handle State
            this.stepHandle = this.handleCPU;
            break;
        case 1:	//DMA Handle State
			this.stepHandle = this.handleDMA;
            break;
		case 2: //Handle Halt State
			this.stepHandle = this.handleHalt;
            break;
		case 3: //DMA Inside Halt State
			this.stepHandle = this.handleDMA;
            break;
		case 4: //Handle Stop State
			this.stepHandle = this.handleStop;
            break;
        default:
            throw(new Error("Invalid state selected."));
	}
}
GameBoyAdvanceIO.prototype.handleCPU = function () {
    //Execute next instruction:
    if (!this.executeDynarec) {
        //Interpreter:
        this.cpu.executeIteration();
    }
    else {
        //LLE Dynarec JIT
        this.executeDynarec = !!this.cpu.dynarec.enter();
    }
}
GameBoyAdvanceIO.prototype.handleDMA = function () {
	if (this.dma.perform()) {
		//If DMA is done, exit it:
        this.deflagStepper(0x1);
	}
}
GameBoyAdvanceIO.prototype.handleHalt = function () {
	if (!this.irq.IRQMatch()) {
		//Clock up to next IRQ match or DMA:
		this.updateCore(this.cyclesUntilNextEvent() | 0);
	}
	else {
		//Exit HALT promptly:
        this.deflagStepper(0x2);
	}
}
GameBoyAdvanceIO.prototype.handleStop = function () {
	//Update sound system to add silence to buffer:
	this.sound.addClocks(this.cyclesToIterate | 0);
	this.cyclesToIterate = 0;
	//Exits when user presses joypad or from an external irq outside of GBA internal.
}
GameBoyAdvanceIO.prototype.cyclesUntilNextEvent = function () {
    //Find the clocks to the next event:
    var clocks = this.irq.nextEventTime() | 0;
    var dmaClocks = this.dma.nextEventTime() | 0;
    clocks = ((clocks > -1) ? ((dmaClocks > -1) ? Math.min(clocks | 0, dmaClocks | 0) : (clocks | 0)) : (dmaClocks | 0)) | 0;
    clocks = ((clocks == -1 || clocks > this.cyclesToIterate) ? (this.cyclesToIterate | 0) : (clocks | 0)) | 0;
    return clocks | 0;
}
GameBoyAdvanceIO.prototype.deflagStepper = function (statusFlag) {
    //Deflag a system event to step through:
    statusFlag = statusFlag | 0;
    this.systemStatus = ((this.systemStatus | 0) & (~statusFlag)) | 0;
    this.preprocessSystemStepper();
}
GameBoyAdvanceIO.prototype.flagStepper = function (statusFlag) {
    //Flag a system event to step through:
    statusFlag = statusFlag | 0;
    this.systemStatus = ((this.systemStatus | 0) | (statusFlag | 0)) | 0;
    this.preprocessSystemStepper();
}