"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012 Grant Galitz
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
function GameBoyAdvanceSWI(CPUCore) {
	this.CPUCore = CPUCore;
	this.IOCore = this.CPUCore.IOCore;
}
GameBoyAdvanceSWI.prototype.execute = function (command) {
	switch (command) {
		//Soft Reset:
		case 0:
			this.SoftReset();
			break;
		//Register Ram Reset:
		case 0x01:
			this.RegisterRAMReset();
			break;
		//Halt:
		case 0x02:
			this.Halt();
			break;
		//Stop:
		case 0x03:
			this.Stop();
			break;
		//Interrupt Wait:
		case 0x04:
			this.IntrWait();
			break;
		//VBlank Interrupt Wait:
		case 0x05:
			this.VBlankIntrWait();
			break;
		//Division:
		case 0x06:
			this.Div();
			break;
		//Division (Reversed Parameters):
		case 0x07:
			this.DivArm();
			break;
		//Square Root:
		case 0x08:
			this.Sqrt();
			break;
		//Arc Tangent:
		case 0x09:
			this.ArcTan();
			break;
		//Arc Tangent Corrected:
		case 0x0A:
			this.ArcTan2();
			break;
		//CPU Set (Memory Copy + Fill):
		case 0x0B:
			this.CpuSet();
			break;
		//CPU Fast Set (Memory Copy + Fill):
		case 0x0C:
			this.CpuFastSet();
			break;
		//Calculate BIOS Checksum:
		case 0x0D:
			this.GetBiosChecksum();
			break;
		//Calculate BG Rotation/Scaling Parameters:
		case 0x0E:
			this.BgAffineSet();
			break;
		//Calculate OBJ Rotation/Scaling Parameters:
		case 0x0F:
			this.ObjAffineSet();
			break;
		//Bit Unpack Tile Data:
		case 0x10:
			this.BitUnPack();
			break;
		//Uncompress LZ77 Compressed Data (WRAM):
		case 0x11:
			this.LZ77UnCompWram();
			break;
		//Uncompress LZ77 Compressed Data (VRAM):
		case 0x12:
			this.LZ77UnCompVram();
			break;
		//Uncompress Huffman Compressed Data:
		case 0x13:
			this.HuffUnComp();
			break;
		//Uncompress Run-Length Compressed Data (WRAM):
		case 0x14:
			this.RLUnCompWram();
			break;
		//Uncompress Run-Length Compressed Data (VRAM):
		case 0x15:
			this.RLUnCompVram();
			break;
		//Filter Out Difference In Data (8-bit/WRAM):
		case 0x16:
			this.Diff8bitUnFilterWram();
			break;
		//Filter Out Difference In Data (8-bit/VRAM):
		case 0x17:
			this.Diff8bitUnFilterVram();
			break;
		//Filter Out Difference In Data (16-bit):
		case 0x18:
			this.Diff16bitUnFilter();
			break;
		//Update Sound Bias:
		case 0x19:
			this.SoundBias();
			break;
		//Sound Driver Initialization:
		case 0x1A:
			this.SoundDriverInit();
			break;
		//Set Sound Driver Mode:
		case 0x1B:
			this.SoundDriverMode();
			break;
		//Call Sound Driver Main:
		case 0x1C:
			this.SoundDriverMain();
			break;
		//Call Sound Driver VSync Iteration Handler:
		case 0x1D:
			this.SoundDriverVSync();
			break;
		//Clear Direct Sound And Stop Audio:
		case 0x1E:
			this.SoundChannelClear();
			break;
		//Convert MIDI To Frequency:
		case 0x1F:
			this.MidiKey2Freq();
			break;
		//Unknown Sound Driver Functions:
		case 0x20:
		case 0x21:
		case 0x22:
		case 0x23:
		case 0x24:
			this.SoundDriverUnknown();
			break;
		//Multi-Boot:
		case 0x25:
			this.MultiBoot();
			break;
		//Hard Reset:
		case 0x26:
			this.HardReset();
			break;
		//Custom Halt:
		case 0x27:
			this.CustomHalt();
			break;
		//Call Sound Driver VSync Stop Handler:
		case 0x28:
			this.SoundDriverVSyncOff();
			break;
		//Call Sound Driver VSync Start Handler:
		case 0x29:
			this.SoundDriverVSyncOn();
			break;
		//Obtain 36 Sound Driver Pointers:
		case 0x2A:
			this.SoundGetJumpList();
			break;
		//Undefined:
		default:
			//Don't do anything if we get here, although a real device errors.
	}
}
GameBoyAdvanceSWI.prototype.SoftReset = function () {
	
}
GameBoyAdvanceSWI.prototype.RegisterRAMReset = function () {
	
}
GameBoyAdvanceSWI.prototype.Halt = function () {
	this.IOCore.systemStatus |= 2;
}
GameBoyAdvanceSWI.prototype.Stop = function () {
	this.IOCore.systemStatus |= 4;
}
GameBoyAdvanceSWI.prototype.IntrWait = function () {
	this.IOCore.irq.IME = true;
    if ((this.CPUCore.registers[0] & 0x1) == 0x1) {
        this.IOCore.irq.interruptsRequested = 0;
    }
    this.IOCore.irq.interruptsEnabled = this.CPUCore.registers[1] & 0x3FFF;
    this.Halt();
}
GameBoyAdvanceSWI.prototype.VBlankIntrWait = function () {
	this.IOCore.irq.IME = true;
    this.IOCore.irq.interruptsRequested = 0;
    this.IOCore.irq.interruptsEnabled = 0x1;
    this.Halt();
}
GameBoyAdvanceSWI.prototype.Div = function () {
	var numerator = this.CPUCore.registers[0];
    var denominator = this.CPUCore.registers[1];
    if (denominator == 0) {
        throw(new Error("Division by 0 called."));
    }
    var result = (numerator / denominator) | 0;
    this.CPUCore.registers[0] = result;
    this.CPUCore.registers[1] = (numerator % denominator) | 0;
    this.CPUCore.registers[3] = Math.abs(result) | 0;
}
GameBoyAdvanceSWI.prototype.DivArm = function () {
	var numerator = this.CPUCore.registers[1];
    var denominator = this.CPUCore.registers[0];
    if (denominator == 0) {
        throw(new Error("Division by 0 called."));
    }
    var result = (numerator / denominator) | 0;
    this.CPUCore.registers[0] = result;
    this.CPUCore.registers[1] = (numerator % denominator) | 0;
    this.CPUCore.registers[3] = Math.abs(result) | 0;
}
GameBoyAdvanceSWI.prototype.Sqrt = function () {
	this.CPUCore.registers[0] = Math.sqrt(this.CPUCore.registers[0] >>> 0) | 0;
}
GameBoyAdvanceSWI.prototype.ArcTan = function () {
    var a = (-(this.CPUCore.performMUL32(this.CPUCore.registers[0], this.CPUCore.registers[0], 0) >> 14)) | 0;
    var b = ((this.CPUCore.performMUL32(0xA9, a, 0) >> 14) + 0x390) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0x91C) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0xFB6) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0x16AA) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0x2081) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0x3651) | 0;
    b = ((this.CPUCore.performMUL32(b, a, 0) >> 14) + 0xA2F9) | 0;
    a = this.CPUCore.performMUL32(this.CPUCore.registers[0], b, 0) >> 16;
    this.CPUCore.registers[0] = a;
}
GameBoyAdvanceSWI.prototype.ArcTan2 = function () {
	var x = this.CPUCore.registers[0];
    var y = this.CPUCore.registers[1];
    var result = 0;
    if (y == 0) {
        result = (x >> 16) & 0x8000;
    }
    else {
        if (x == 0) {
            result = ((y >> 16) & 0x8000) + 0x4000;
        }
        else {
            if ((Math.abs(x) > Math.abs(y)) || (Math.abs(x) == Math.abs(y) && (x >= 0 || y >= 0))) {
                this.CPUCore.registers[1] = x;
                this.CPUCore.registers[0] = y << 14;
                this.Div();
                this.ArcTan();
                if (x < 0) {
                    result = 0x8000 + this.CPUCore.registers[0];
                }
                else {
                    result = (((y >> 16) & 0x8000) << 1) + this.CPUCore.registers[0];
                }
            }
            else {
                this.CPUCore.registers[0] = x << 14;
                this.Div();
                this.ArcTan();
                result = (0x4000 + ((y >> 16) & 0x8000)) - this.CPUCore.registers[0];
            }
        }
    }
    this.CPUCore.registers[0] = result | 0;
}
GameBoyAdvanceSWI.prototype.CpuSet = function () {
	var source = this.CPUCore.registers[0];
    var destination = this.CPUCore.registers[1];
    var control = this.CPUCore.registers[2];
    var count = control & 0x1FFFFF;
    var isFixed = ((control & 0x1000000) != 0);
    var is32 = ((control & 0x4000000) != 0);
    if (is32) {
        while (count-- > 0) {
            if (source >= 0x4000 && destination >= 0x4000) {
                this.IOCore.memoryWrite32(destination, this.IOCore.memoryRead32(source));
            }
            if (!isFixed) {
                source += 0x4;
            }
            destination += 0x4;
        }
    }
    else {
        while (count-- > 0) {
            if (source >= 0x4000 && destination >= 0x4000) {
                this.IOCore.memoryWrite16(destination, this.IOCore.memoryRead16(source));
            }
            if (!isFixed) {
                source += 0x2;
            }
            destination += 0x2;
        }
    }
}
GameBoyAdvanceSWI.prototype.CpuFastSet = function () {
	var source = this.CPUCore.registers[0];
    var destination = this.CPUCore.registers[1];
    var control = this.CPUCore.registers[2];
    var count = control & 0x1FFFFF;
    var isFixed = ((control & 0x1000000) != 0);
    var currentRead = 0;
    while (count-- > 0) {
        if (source >= 0x4000) {
            currentRead = this.IOCore.memoryRead32(source);
            for (var i = 0; i < 0x8; ++i) {
                if (destination >= 0x4000) {
                    this.IOCore.memoryWrite32(destination, currentRead);
                }
                destination += 0x4;
            }
        }
        if (!isFixed) {
            source += 0x20;
        }
    }
}
GameBoyAdvanceSWI.prototype.GetBiosChecksum = function () {
	this.CPUCore.registers[0] = 0xBAAE187F;
}
GameBoyAdvanceSWI.prototype.BgAffineSet = function () {
	
}
GameBoyAdvanceSWI.prototype.ObjAffineSet = function () {
	
}
GameBoyAdvanceSWI.prototype.BitUnPack = function () {
	
}
GameBoyAdvanceSWI.prototype.LZ77UnCompWram = function () {
	
}
GameBoyAdvanceSWI.prototype.LZ77UnCompVram = function () {
	
}
GameBoyAdvanceSWI.prototype.HuffUnComp = function () {
	
}
GameBoyAdvanceSWI.prototype.RLUnCompWram = function () {
	
}
GameBoyAdvanceSWI.prototype.RLUnCompVram = function () {
	
}
GameBoyAdvanceSWI.prototype.Diff8bitUnFilterWram = function () {
	
}
GameBoyAdvanceSWI.prototype.Diff8bitUnFilterVram = function () {
	
}
GameBoyAdvanceSWI.prototype.Diff16bitUnFilter = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundBias = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverInit = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverMode = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverMain = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverVSync = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundChannelClear = function () {
	
}
GameBoyAdvanceSWI.prototype.MidiKey2Freq = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverUnknown = function () {
	
}
GameBoyAdvanceSWI.prototype.MultiBoot = function () {
	
}
GameBoyAdvanceSWI.prototype.HardReset = function () {
	
}
GameBoyAdvanceSWI.prototype.CustomHalt = function () {
	this.IOCore.wait.writeHALTCNT(this.CPUCore.registers[2]);
}
GameBoyAdvanceSWI.prototype.SoundDriverVSyncOff = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundDriverVSyncOn = function () {
	
}
GameBoyAdvanceSWI.prototype.SoundGetJumpList = function () {
	
}