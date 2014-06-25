"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2014 Grant Galitz
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
function GameBoyAdvanceIO(settings, coreExposed, BIOS, ROM) {
    //State Machine Tracking:
    this.tracking = getInt32Array(8);
    this.BIOSFound = false;
    //References passed to us:
    this.settings = settings;
    this.coreExposed = coreExposed;
    this.BIOS = BIOS;
    this.ROM = ROM;
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
    this.saves = new GameBoyAdvanceSaves(this);
    this.wait = new GameBoyAdvanceWait(this);
    this.cpu = new GameBoyAdvanceCPU(this);
    this.memory.loadReferences();
    //Start in CPU interpreter mode:
    this.stepHandle = this.handleCPUInterpreter;
}
GameBoyAdvanceIO.prototype.iterate = function (CPUCyclesTotal) {
    //Find out how many clocks to iterate through this run:
    this.tracking[1] = ((CPUCyclesTotal | 0) + (this.tracking[2] | 0)) | 0;
    //An extra check to make sure we don't do stuff if we did too much last run:
    if ((this.tracking[1] | 0) > 0) {
        //Update our core event prediction:
        this.updateCoreEventTime();
        //If clocks remaining, run iterator:
        this.runIterator();
        //Spill our core event clocking:
        this.updateCoreClocking();
        //Ensure audio buffers at least once per iteration:
        this.sound.audioJIT();
    }
    //If we clocked just a little too much, subtract the extra from the next run:
    this.tracking[2] = this.tracking[1] | 0;
}
GameBoyAdvanceIO.prototype.runIterator = function () {
    //Clock through the state machine:
    while ((this.tracking[1] | 0) > 0) {
        //Handle the current system state selected:
        this.stepHandle();
    }
}
GameBoyAdvanceIO.prototype.updateCore = function (clocks) {
    clocks = clocks | 0;
    //This is used during normal/dma modes of operation:
    this.tracking[3] = ((this.tracking[3] | 0) + (clocks | 0)) | 0;
    if ((this.tracking[3] | 0) >= (this.tracking[7] | 0)) {
        this.updateCoreSpill();
    }
}
GameBoyAdvanceIO.prototype.updateCoreSingle = function () {
    //This is used during normal/dma modes of operation:
    this.tracking[3] = ((this.tracking[3] | 0) + 1) | 0;
    if ((this.tracking[3] | 0) >= (this.tracking[7] | 0)) {
        this.updateCoreSpill();
    }
}
GameBoyAdvanceIO.prototype.updateCoreTwice = function () {
    //This is used during normal/dma modes of operation:
    this.tracking[3] = ((this.tracking[3] | 0) + 2) | 0;
    if ((this.tracking[3] | 0) >= (this.tracking[7] | 0)) {
        this.updateCoreSpill();
    }
}
GameBoyAdvanceIO.prototype.updateCoreSpill = function () {
    this.updateCoreClocking();
    this.updateCoreEventTime();
}
GameBoyAdvanceIO.prototype.updateCoreSpillRetain = function () {
    //Keep the last prediction, just decrement it out, as it's still valid:
    this.tracking[7] = ((this.tracking[7] | 0) - (this.tracking[3] | 0)) | 0;
    this.updateCoreClocking();
}
GameBoyAdvanceIO.prototype.updateCoreClocking = function () {
    var clocks = this.tracking[3] | 0;
    //Decrement the clocks per iteration counter:
    this.tracking[1] = ((this.tracking[1] | 0) - (clocks | 0)) | 0;
    //Clock all components:
    this.gfx.addClocks(((clocks | 0) - (this.tracking[4] | 0)) | 0);
    this.timer.addClocks(((clocks | 0) - (this.tracking[5] | 0)) | 0);
    this.serial.addClocks(((clocks | 0) - (this.tracking[6] | 0)) | 0);
    this.tracking[3] = 0;
    this.tracking[4] = 0;
    this.tracking[5] = 0;
    this.tracking[6] = 0;
}
GameBoyAdvanceIO.prototype.updateGraphicsClocking = function () {
    //Clock gfx component:
    this.gfx.addClocks(((this.tracking[3] | 0)  - (this.tracking[4] | 0)) | 0);
    this.tracking[4] = this.tracking[3] | 0;
}
GameBoyAdvanceIO.prototype.updateTimerClocking = function () {
    //Clock timer component:
    this.timer.addClocks(((this.tracking[3] | 0)  - (this.tracking[5] | 0)) | 0);
    this.tracking[5] = this.tracking[3] | 0;
}
GameBoyAdvanceIO.prototype.updateSerialClocking = function () {
    //Clock serial component:
    this.serial.addClocks(((this.tracking[3] | 0)  - (this.tracking[6] | 0)) | 0);
    this.tracking[6] = this.tracking[3] | 0;
}
GameBoyAdvanceIO.prototype.updateCoreEventTime = function () {
    //Predict how many clocks until the next DMA or IRQ event:
    this.tracking[7] = this.cyclesUntilNextEvent() | 0;
}
GameBoyAdvanceIO.prototype.getRemainingCycles = function () {
    //Return the number of cycles left until iteration end:
    return Math.max(this.tracking[1] | 0, 0) | 0;
}
GameBoyAdvanceIO.prototype.preprocessSystemStepper = function () {
    switch (this.tracking[0] | 0) {
        case 0: //CPU Handle State
            this.stepHandle = this.handleCPUInterpreter;
            break;
        case 1: //DMA Handle State
            this.stepHandle = this.handleDMA;
            break;
        case 2: //Handle Halt State
            this.stepHandle = this.handleHalt;
            break;
        case 3: //DMA Inside Halt State
            this.stepHandle = this.handleDMA;
            break;
        default: //Handle Stop State
            this.stepHandle = this.handleStop;
    }
}
GameBoyAdvanceIO.prototype.handleCPUInterpreter = function () {
    //Execute next instruction:
    //Interpreter:
    this.cpu.executeIteration();
}
GameBoyAdvanceIO.prototype.handleDMA = function () {
    this.dma.perform();
}
GameBoyAdvanceIO.prototype.handleHalt = function () {
    if (!this.irq.IRQMatch()) {
        //Clock up to next IRQ match or DMA:
        this.updateCore(this.cyclesUntilNextHALTEvent() | 0);
    }
    else {
        //Exit HALT promptly:
        this.deflagStepper(0x2);
    }
}
GameBoyAdvanceIO.prototype.handleStop = function () {
    //Update sound system to add silence to buffer:
    this.sound.addClocks(this.getRemainingCycles() | 0);
    this.tracking[1] = 0;
    //Exits when user presses joypad or from an external irq outside of GBA internal.
}
GameBoyAdvanceIO.prototype.cyclesUntilNextHALTEvent = function () {
    //Find the clocks to the next HALT leave or DMA event:
    var haltClocks = this.irq.nextEventTime() | 0;
    var dmaClocks = this.dma.nextEventTime() | 0;
    return this.solveClosestTime(haltClocks, dmaClocks) | 0;
}
GameBoyAdvanceIO.prototype.cyclesUntilNextEvent = function () {
    //Find the clocks to the next IRQ or DMA event:
    var irqClocks = this.irq.nextIRQEventTime() | 0;
    var dmaClocks = this.dma.nextEventTime() | 0;
    return this.solveClosestTime(irqClocks, dmaClocks) | 0;
}
GameBoyAdvanceIO.prototype.solveClosestTime = function (clocks1, clocks2) {
    clocks1 = clocks1 | 0;
    clocks2 = clocks2 | 0;
    //Find the clocks closest to the next event:
    var clocks = this.getRemainingCycles() | 0;
    if (clocks1 >= 0) {
        if (clocks2 >= 0) {
            clocks = Math.min(clocks, clocks1, clocks2) | 0;
        }
        else {
            clocks = Math.min(clocks, clocks1) | 0;
        }
    }
    else if (clocks2 >= 0) {
        clocks = Math.min(clocks, clocks2) | 0;
    }
    return clocks | 0;
}
GameBoyAdvanceIO.prototype.deflagStepper = function (statusFlag) {
    statusFlag = statusFlag | 0;
    //Deflag a system event to step through:
    this.tracking[0] = this.tracking[0] & (~statusFlag);
    this.preprocessSystemStepper();
}
GameBoyAdvanceIO.prototype.flagStepper = function (statusFlag) {
    statusFlag = statusFlag | 0;
    //Flag a system event to step through:
    this.tracking[0] = this.tracking[0] | statusFlag;
    this.preprocessSystemStepper();
}