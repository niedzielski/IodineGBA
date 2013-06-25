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
function GameBoyAdvanceWait(IOCore) {
	this.IOCore = IOCore;
    this.memory = this.IOCore.memory;
	this.initialize();
}
GameBoyAdvanceWait.prototype.GAMEPAKWaitStateTable = [
	5, 4, 3, 9
];
GameBoyAdvanceWait.prototype.initialize = function () {
	this.WRAMConfiguration = [0xD, 0x20];	//WRAM configuration control register current data.
	this.WRAMWaitState = 3;					//External WRAM wait state.
	this.SRAMWaitState = 5;
	this.CARTWaitState0First = 5;
	this.CARTWaitState0Second = 3;
	this.CARTWaitState1First = 5;
	this.CARTWaitState1Second = 5;
	this.CARTWaitState2First = 5;
	this.CARTWaitState2Second = 9;
	this.POSTBOOT = 0;
	this.width = 8;
	this.nonSequential = true;
	this.ROMPrebuffer = 0;
	this.prefetchEnabled = true;
	this.WAITCNT0 = 0;
	this.WAITCNT1 = 0;
}
GameBoyAdvanceWait.prototype.writeWAITCNT0 = function (data) {
	this.SRAMWaitState = this.GAMEPAKWaitStateTable[data & 0x3];
	this.CARTWaitState0First = this.GAMEPAKWaitStateTable[(data >> 2) & 0x3];
	this.CARTWaitState0Second = ((data & 0x10) == 0x10) ? 0x2 : 0x3;
	this.CARTWaitState1First = this.GAMEPAKWaitStateTable[(data >> 5) & 0x3];
	this.CARTWaitState1Second = (data > 0x7F) ? 0x2 : 0x5;
	this.WAITCNT0 = data;
}
GameBoyAdvanceWait.prototype.readWAITCNT0 = function () {
	return this.WAITCNT0;
}
GameBoyAdvanceWait.prototype.writeWAITCNT1 = function (data) {
	this.CARTWaitState2First = this.GAMEPAKWaitStateTable[data & 0x3];
	this.CARTWaitState2Second = ((data & 0x8) == 0x8) ? 0x2 : 0x9;
	this.prefetchEnabled = ((data & 0x40) == 0x40);
	if (!this.prefetchEnabled) {
		this.ROMPrebuffer = 0;
	}
	this.WAITCNT1 = data;
}
GameBoyAdvanceWait.prototype.readWAITCNT1 = function () {
	return this.WAITCNT1 | 0x20;
}
GameBoyAdvanceWait.prototype.writePOSTBOOT = function (data) {
	this.POSTBOOT = data;
}
GameBoyAdvanceWait.prototype.readPOSTBOOT = function () {
	return this.POSTBOOT;
}
GameBoyAdvanceWait.prototype.writeHALTCNT = function (data) {
	//HALT/STOP mode entrance:
	this.IOCore.systemStatus |= (data < 0x80) ? 2 : 4;
}
GameBoyAdvanceWait.prototype.writeConfigureWRAM = function (address, data) {
	switch (address & 0x3) {
		case 3:
			this.WRAMConfiguration[1] = data & 0x2F;
			this.IOCore.remapWRAM(data);
			break;
		case 0:
			this.WRAMWaitState = 0x10 - (data & 0xF);
			this.WRAMConfiguration[0] = data;
	}
}
GameBoyAdvanceWait.prototype.readConfigureWRAM = function (address) {
	switch (address & 0x3) {
		case 3:
			return this.WRAMConfiguration[1];
			break;
		case 0:
			return this.WRAMConfiguration[0];
			break;
		default:
			return 0;
	}
}
GameBoyAdvanceWait.prototype.CPUInternalCyclePrefetch = function (address, clocks) {
	address = address | 0;
    clocks = clocks | 0;
    //Clock for idle CPU time:
	this.IOCore.updateCore(clocks | 0);
	//Check for ROM prefetching:
	if (this.prefetchEnabled) {
		//We were already in ROM, so if prefetch do so as sequential:
		//Only case for non-sequential ROM prefetch is invalid anyways:
		switch ((address >>> 24) & 0xF) {
			case 0x8:
			case 0x9:
				while (clocks >= this.CARTWaitState0Second) {
					clocks -= this.CARTWaitState0Second;
					++this.ROMPrebuffer;
				}
				break;
			case 0xA:
			case 0xB:
				while (clocks >= this.CARTWaitState1Second) {
					clocks -= this.CARTWaitState1Second;
					++this.ROMPrebuffer;
				}
				break;
			case 0xC:
			case 0xD:
				while (clocks >= this.CARTWaitState1Second) {
					clocks -= this.CARTWaitState1Second;
					++this.ROMPrebuffer;
				}
		}
		//ROM buffer caps out at 8 x 16 bit:
		if (this.ROMPrebuffer > 8) {
			this.ROMPrebuffer = 8;
		}
	}
}
GameBoyAdvanceWait.prototype.CPUGetOpcode16 = function (address) {
	address = address | 0;
    if (address >= 0x8000000 && address < 0xE000000) {
		var clocks = 0;
        if (this.prefetchEnabled) {
			if (this.ROMPrebuffer > 0) {
				--this.ROMPrebuffer;
				this.FASTAccess2();
				return this.IOCore.cartridge.readROM16(address & 0x1FFFFFF) | 0;
			}
            if (address < 0xA000000) {
                clocks = ((this.nonSequential) ? (this.CARTWaitState0First | 0) : (this.CARTWaitState0Second | 0)) | 0;
            }
            else if (address < 0xC000000) {
                clocks = ((this.nonSequential) ? (this.CARTWaitState1First | 0) : (this.CARTWaitState1Second | 0)) | 0;
            }
            else {
                clocks = ((this.nonSequential) ? (this.CARTWaitState2First | 0) : (this.CARTWaitState2Second | 0)) | 0;
            }
		}
		else {
			if (address < 0xA000000) {
                clocks = this.CARTWaitState0First | 0;
            }
            else if (address < 0xC000000) {
                clocks = this.CARTWaitState1First | 0;
            }
            else {
                clocks = this.CARTWaitState2First | 0;
            }
		}
        this.IOCore.updateCore(clocks | 0);
        this.nonSequential = false;
        return this.IOCore.cartridge.readROM16(address & 0x1FFFFFF) | 0;
	}
	return this.memory.memoryReadFast16(address >>> 0) | 0;
}
GameBoyAdvanceWait.prototype.CPUGetOpcode32 = function (address) {
	address = address | 0;
    if ((address | 0) >= 0x8000000 && (address | 0) < 0xE000000) {
		var clocks = 0;
        if (this.prefetchEnabled) {
			if (this.ROMPrebuffer > 1) {
				this.ROMPrebuffer -= 2;
				this.FASTAccess2();
				return this.IOCore.cartridge.readROM32(address & 0x1FFFFFF) | 0;
			}
			else if (this.ROMPrebuffer == 1) {
				//Buffer miss if only 16 bits out of 32 bits stored:
				--this.ROMPrebuffer;
			}
            if (address < 0xA000000) {
                clocks = (((this.nonSequential) ? (this.CARTWaitState0First | 0) : (this.CARTWaitState0Second | 0)) + (this.CARTWaitState0Second | 0)) | 0;
            }
            else if (address < 0xC000000) {
                clocks = (((this.nonSequential) ? (this.CARTWaitState1First | 0) : (this.CARTWaitState1Second | 0)) + (this.CARTWaitState1Second | 0)) | 0;
            }
            else {
                clocks = (((this.nonSequential) ? (this.CARTWaitState2First | 0) : (this.CARTWaitState2Second | 0)) + (this.CARTWaitState2Second | 0)) | 0;
            }
		}
		else {
            if (address < 0xA000000) {
                clocks = ((this.CARTWaitState0First | 0) + (this.CARTWaitState0Second | 0)) | 0;
            }
            else if (address < 0xC000000) {
                clocks = ((this.CARTWaitState1First | 0) + (this.CARTWaitState1Second | 0)) | 0;
            }
            else {
                clocks = ((this.CARTWaitState2First | 0) + (this.CARTWaitState2Second | 0)) | 0;
            }
		}
        this.IOCore.updateCore(clocks | 0);
        this.nonSequential = false;
        return this.IOCore.cartridge.readROM32(address & 0x1FFFFFF) | 0;
	}
	return this.memory.memoryReadFast32(address >>> 0) | 0;
}
GameBoyAdvanceWait.prototype.NonSequentialBroadcast = function () {
	this.nonSequential = true;
	this.ROMPrebuffer = 0;
}
GameBoyAdvanceWait.prototype.FASTAccess = function (reqByteNumber) {
    if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
        this.IOCore.updateCore(1);
        this.nonSequential = false;
    }
}
GameBoyAdvanceWait.prototype.FASTAccess2 = function () {
	this.IOCore.updateCore(1);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.WRAMAccess = function (reqByteNumber) {
	if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
		this.IOCore.updateCore(this.WRAMWaitState | 0);
	}
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.WRAMAccess8 = function () {
    this.IOCore.updateCore(this.WRAMWaitState | 0);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.WRAMAccess16 = function () {
    this.IOCore.updateCore(this.WRAMWaitState | 0);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.WRAMAccess32 = function () {
    this.IOCore.updateCore(this.WRAMWaitState << 1);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.ROM0Access = function (reqByteNumber) {
	if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
		if (this.nonSequential) {
			this.IOCore.updateCore(this.CARTWaitState0First | 0);
			this.nonSequential = false;
		}
		else {
			this.IOCore.updateCore(this.CARTWaitState0Second | 0);
		}
	}
}
GameBoyAdvanceWait.prototype.ROM0Access8 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState0First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState0Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM0Access16 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState0First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState0Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM0Access32 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(((this.CARTWaitState0First | 0) + (this.CARTWaitState0Second | 0)));
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState0Second << 1);
    }
}
GameBoyAdvanceWait.prototype.ROM1Access = function (reqByteNumber) {
	if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
		if (this.nonSequential) {
			this.IOCore.updateCore(this.CARTWaitState1First | 0);
			this.nonSequential = false;
		}
		else {
			this.IOCore.updateCore(this.CARTWaitState1Second | 0);
		}
	}
}
GameBoyAdvanceWait.prototype.ROM1Access8 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState1First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState1Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM1Access16 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState1First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState1Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM1Access32 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(((this.CARTWaitState1First | 0) + (this.CARTWaitState1Second | 0)));
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState1Second << 1);
    }
}
GameBoyAdvanceWait.prototype.ROM2Access = function (reqByteNumber) {
	if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
		if (this.nonSequential) {
			this.IOCore.updateCore(this.CARTWaitState2First | 0);
			this.nonSequential = false;
		}
		else {
			this.IOCore.updateCore(this.CARTWaitState2Second | 0);
		}
	}
}
GameBoyAdvanceWait.prototype.ROM2Access8 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState2First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState2Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM2Access16 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(this.CARTWaitState2First | 0);
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState2Second | 0);
    }
}
GameBoyAdvanceWait.prototype.ROM2Access32 = function () {
    if (this.nonSequential) {
        this.IOCore.updateCore(((this.CARTWaitState2First | 0) + (this.CARTWaitState2Second | 0)));
        this.nonSequential = false;
    }
    else {
        this.IOCore.updateCore(this.CARTWaitState2Second << 1);
    }
}
GameBoyAdvanceWait.prototype.SRAMAccess = function () {
	this.IOCore.updateCore(this.SRAMWaitState | 0);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.VRAMAccess = function (reqByteNumber) {
	if ((reqByteNumber & 0x1) == 0x1 || this.width == 8) {
		this.IOCore.updateCore((this.IOCore.gfx.isRendering()) ? 2 : 1);
	}
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.VRAMAccess8 = function () {
    this.IOCore.updateCore((this.IOCore.gfx.isRendering()) ? 2 : 1);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.VRAMAccess16 = function () {
    this.IOCore.updateCore((this.IOCore.gfx.isRendering()) ? 2 : 1);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.VRAMAccess32 = function () {
    this.IOCore.updateCore((this.IOCore.gfx.isRendering()) ? 4 : 2);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.OAMAccess = function (reqByteNumber) {
	switch (reqByteNumber | 0) {
		case 0:
			if (this.width != 8) {
				return;
			}
		case 1:
			if (this.width != 16) {
				return;
			}
		case 3:
			this.IOCore.updateCore(this.IOCore.gfx.OAMLockedCycles() + 1);
	}
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.OAMAccess8 = function () {
    this.IOCore.updateCore(((this.IOCore.gfx.OAMLockedCycles() | 0) + 1) | 0);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.OAMAccess16 = function () {
    this.IOCore.updateCore(((this.IOCore.gfx.OAMLockedCycles() | 0) + 1) | 0);
	this.nonSequential = false;
}
GameBoyAdvanceWait.prototype.OAMAccess32 = function () {
    this.IOCore.updateCore(((this.IOCore.gfx.OAMLockedCycles() | 0) + 1) | 0);
	this.nonSequential = false;
}