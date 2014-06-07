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
function GameBoyAdvanceMemory(IOCore) {
    //Reference to the emulator core:
    this.IOCore = IOCore;
    //WRAM Map Control Stuff:
    this.WRAMControlFlags = 0x20;
    //Load the BIOS:
    this.BIOS = getUint8Array(0x4000);
    this.BIOS16 = getUint16View(this.BIOS);
    this.BIOS32 = getInt32View(this.BIOS);
    this.loadBIOS();
    //Initialize Some RAM:
    this.externalRAM = getUint8Array(0x40000);
    this.externalRAM16 = getUint16View(this.externalRAM);
    this.externalRAM32 = getInt32View(this.externalRAM);
    this.internalRAM = getUint8Array(0x8000);
    this.internalRAM16 = getUint16View(this.internalRAM);
    this.internalRAM32 = getInt32View(this.internalRAM);
    this.lastBIOSREAD = 0;        //BIOS read bus last.
    //After all sub-objects initialized, initialize dispatches:
    var generator = new GameBoyAdvanceMemoryDispatchGenerator(this);
    this.readIO8 = generator.generateMemoryReadIO8();
    this.readIO16 = generator.generateMemoryReadIO16();
    this.readIO32 = generator.generateMemoryReadIO32();
    this.writeIO8 = generator.generateMemoryWriteIO8();
    this.writeIO16 = generator.generateMemoryWriteIO16();
    this.writeIO32 = generator.generateMemoryWriteIO32();
    this.memoryReader8Generated = [
                                   generator.generateMemoryRead80(),
                                   generator.generateMemoryRead81(),
                                   generator.generateMemoryRead82()
                                   ];
    this.memoryReader8 = this.memoryReader8Generated[1];
    this.memoryWriter8Generated = [
                                   generator.generateMemoryWrite80(),
                                   generator.generateMemoryWrite81(),
                                   generator.generateMemoryWrite82()
                                   ];
    this.memoryWriter8 = this.memoryWriter8Generated[1];
    this.memoryReader16Generated = [
                                   generator.generateMemoryRead160(),
                                   generator.generateMemoryRead161(),
                                   generator.generateMemoryRead162()
                                   ];
    this.memoryReader16 = this.memoryReader16Generated[1];
    this.memoryReader16CPUGenerated = [
                                    generator.generateMemoryInstructionRead160(),
                                    generator.generateMemoryInstructionRead161(),
                                    generator.generateMemoryInstructionRead162()
                                    ];
    this.memoryReader16CPU = this.memoryReader16CPUGenerated[1];
    this.memoryWriter16Generated = [
                                   generator.generateMemoryWrite160(),
                                   generator.generateMemoryWrite161(),
                                   generator.generateMemoryWrite162()
                                   ];
    this.memoryWriter16 = this.memoryWriter16Generated[1];
    this.memoryReader32Generated = [
                                       generator.generateMemoryRead320(),
                                       generator.generateMemoryRead321(),
                                       generator.generateMemoryRead322()
                                       ];
    this.memoryReader32 = this.memoryReader32Generated[1];
    this.memoryReader32CPUGenerated = [
                                       generator.generateMemoryInstructionRead320(),
                                       generator.generateMemoryInstructionRead321(),
                                       generator.generateMemoryInstructionRead322()
                                       ];
    this.memoryReader32CPU = this.memoryReader32CPUGenerated[1];
    this.memoryWriter32Generated = [
                                    generator.generateMemoryWrite320(),
                                    generator.generateMemoryWrite321(),
                                    generator.generateMemoryWrite322()
                                    ];
    this.memoryWriter32 = this.memoryWriter32Generated[1];
}
GameBoyAdvanceMemory.prototype.loadReferences = function () {
    //Initialize the various handler objects:
    this.dma = this.IOCore.dma;
    this.gfx = this.IOCore.gfx;
    this.sound = this.IOCore.sound;
    this.timer = this.IOCore.timer;
    this.irq = this.IOCore.irq;
    this.serial = this.IOCore.serial;
    this.joypad = this.IOCore.joypad;
    this.cartridge = this.IOCore.cartridge;
    this.wait = this.IOCore.wait;
    this.cpu = this.IOCore.cpu;
    this.saves = this.IOCore.saves;
}
GameBoyAdvanceMemory.prototype.memoryWriteFast8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.memoryWriter8(address | 0, data & 0xFF);
}
GameBoyAdvanceMemory.prototype.memoryWrite16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.memoryWriter16(address & -2, data & 0xFFFF);
}
GameBoyAdvanceMemory.prototype.memoryWriteFast16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.memoryWriter16(address | 0, data & 0xFFFF);
}
GameBoyAdvanceMemory.prototype.memoryWrite32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.memoryWriter32(address & -4, data | 0);
}
GameBoyAdvanceMemory.prototype.memoryWriteFast32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.memoryWriter32(address | 0, data | 0);
}
GameBoyAdvanceMemory.prototype.memoryReadFast8 = function (address) {
    address = address | 0;
    return this.memoryReader8(address | 0) & 0xFF;
}
GameBoyAdvanceMemory.prototype.memoryRead16 = function (address) {
    address = address | 0;
    return this.memoryReader16(address & -2) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.memoryReadFast16 = function (address) {
    address = address | 0;
    return this.memoryReader16(address | 0) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.memoryReadCPU16 = function (address) {
    address = address | 0;
    return this.memoryReader16CPU(address | 0) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.memoryRead32 = function (address) {
    address = address | 0;
    return this.memoryReader32(address & -4) | 0;
}
GameBoyAdvanceMemory.prototype.memoryReadFast32 = function (address) {
    address = address | 0;
    return this.memoryReader32(address | 0) | 0;
}
GameBoyAdvanceMemory.prototype.memoryReadCPU32 = function (address) {
    address = address | 0;
    return this.memoryReader32CPU(address | 0) | 0;
}
GameBoyAdvanceMemory.prototype.writeExternalWRAM8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    //External WRAM:
    this.wait.WRAMAccess8();
    this.externalRAM[address & 0x3FFFF] = data | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceMemory.prototype.writeExternalWRAM16 = function (address, data) {
        address = address | 0;
        data = data | 0;
        //External WRAM:
        this.wait.WRAMAccess16();
        this.externalRAM16[(address >> 1) & 0x1FFFF] = data | 0;
    }
    GameBoyAdvanceMemory.prototype.writeExternalWRAM32 = function (address, data) {
        address = address | 0;
        data = data | 0;
        //External WRAM:
        this.wait.WRAMAccess32();
        this.externalRAM32[(address >> 2) & 0xFFFF] = data | 0;
    }
}
else {
    GameBoyAdvanceMemory.prototype.writeExternalWRAM16 = function (address, data) {
        //External WRAM:
        this.wait.WRAMAccess16();
        this.externalRAM[address & 0x3FFFF] = data & 0xFF;
        this.externalRAM[(address + 1) & 0x3FFFF] = data >> 8;
    }
    GameBoyAdvanceMemory.prototype.writeExternalWRAM32 = function (address, data) {
        //External WRAM:
        this.wait.WRAMAccess32();
        this.externalRAM[address & 0x3FFFF] = data & 0xFF;
        this.externalRAM[(address + 1) & 0x3FFFF] = (data >> 8) & 0xFF;
        this.externalRAM[(address + 2) & 0x3FFFF] = (data >> 16) & 0xFF;
        this.externalRAM[(address + 3) & 0x3FFFF] = data >>> 24;
    }
}
GameBoyAdvanceMemory.prototype.writeInternalWRAM8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    //Internal WRAM:
    this.IOCore.updateCoreSingle();
    this.internalRAM[address & 0x7FFF] = data | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceMemory.prototype.writeInternalWRAM16 = function (address, data) {
        address = address | 0;
        data = data | 0;
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        this.internalRAM16[(address >> 1) & 0x3FFF] = data | 0;
    }
    GameBoyAdvanceMemory.prototype.writeInternalWRAM32 = function (address, data) {
        address = address | 0;
        data = data | 0;
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        this.internalRAM32[(address >> 2) & 0x1FFF] = data | 0;
    }
}
else {
    GameBoyAdvanceMemory.prototype.writeInternalWRAM16 = function (address, data) {
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        this.internalRAM[address & 0x7FFF] = data & 0xFF;
        this.internalRAM[(address + 1) & 0x7FFF] = data >> 8;
    }
    GameBoyAdvanceMemory.prototype.writeInternalWRAM32 = function (address, data) {
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        this.internalRAM[address & 0x7FFF] = data & 0xFF;
        this.internalRAM[(address + 1) & 0x7FFF] = (data >> 8) & 0xFF;
        this.internalRAM[(address + 2) & 0x7FFF] = (data >> 16) & 0xFF;
        this.internalRAM[(address + 3) & 0x7FFF] = data >>> 24;
    }
}
GameBoyAdvanceMemory.prototype.writeIODispatch8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateCoreSingle();
    if ((address | 0) < 0x4000302) {
        //IO Write:
        this.writeIO8[address & 0x3FF](this, data | 0);
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.wait.writeConfigureWRAM8(address | 0, data | 0);
    }
}
GameBoyAdvanceMemory.prototype.writeIODispatch16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateCoreSingle();
    if ((address | 0) < 0x4000301) {
        //IO Write:
        address = address >> 1;
        this.writeIO16[address & 0x1FF](this, data | 0);
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.wait.writeConfigureWRAM16(address | 0, data | 0);
    }
}
GameBoyAdvanceMemory.prototype.writeIODispatch32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateCoreSingle();
    if ((address | 0) < 0x4000301) {
        //IO Write:
        address = address >> 2;
        this.writeIO32[address & 0xFF](this, data | 0);
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.wait.writeConfigureWRAM32(data | 0);
    }
}
if (!!Math.imul) {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceMemory.prototype.writeVRAM8 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.IOCore.updateGraphicsClocking();
        this.wait.VRAMAccess8();
        if ((address & 0x10000) != 0) {
            if ((address & 0x17FFF) < 0x14000 && (this.gfx.BGMode | 0) >= 3) {
                this.gfx.writeVRAM16(address & 0x17FFE, Math.imul(data | 0, 0x101) | 0);
            }
        }
        else {
            this.gfx.writeVRAM16(address & 0xFFFE, Math.imul(data | 0, 0x101) | 0);
        }
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceMemory.prototype.writeVRAM8 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.IOCore.updateGraphicsClocking();
        this.wait.VRAMAccess8();
        if ((address & 0x10000) != 0) {
            if ((address & 0x17FFF) < 0x14000 && (this.gfx.BGMode | 0) >= 3) {
                this.gfx.writeVRAM16(address & 0x17FFE, (data * 0x101) | 0);
            }
        }
        else {
            this.gfx.writeVRAM16(address & 0xFFFE, (data * 0x101) | 0);
        }
    }
}
GameBoyAdvanceMemory.prototype.writeVRAM16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16();
    address = address & (((address & 0x10000) >> 1) ^ address);
    this.gfx.writeVRAM16(address & 0x1FFFE, data | 0);
}
GameBoyAdvanceMemory.prototype.writeVRAM32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32();
    address = address & (((address & 0x10000) >> 1) ^ address);
    this.gfx.writeVRAM32(address & 0x1FFFC, data | 0);
}
GameBoyAdvanceMemory.prototype.writeOAM8 = function (address, data) {
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess8();
}
GameBoyAdvanceMemory.prototype.writeOAM16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess16();
    this.gfx.writeOAM16(address & 0x3FE, data | 0);
}
GameBoyAdvanceMemory.prototype.writeOAM32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess32();
    this.gfx.writeOAM32(address & 0x3FC, data | 0);
}
if (!!Math.imul) {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceMemory.prototype.writePalette8 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.IOCore.updateGraphicsClocking();
        this.wait.VRAMAccess8();
        this.gfx.writePalette16(address & 0x3FE, Math.imul(data | 0, 0x101) | 0);
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceMemory.prototype.writePalette8 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.IOCore.updateGraphicsClocking();
        this.wait.VRAMAccess8();
        this.gfx.writePalette16(address & 0x3FE, (data * 0x101) | 0);
    }
}
GameBoyAdvanceMemory.prototype.writePalette16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16();
    this.gfx.writePalette16(address & 0x3FE, data | 0);
}
GameBoyAdvanceMemory.prototype.writePalette32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32();
    this.gfx.writePalette32(address & 0x3FC, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM08 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess8(address | 0);
    this.cartridge.writeROM8(address & 0x1FFFFFF, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM016 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess16(address | 0);
    this.cartridge.writeROM16(address & 0x1FFFFFE, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM032 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess32(address | 0);
    this.cartridge.writeROM32(address & 0x1FFFFFC, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM18 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess8(address | 0);
    this.cartridge.writeROM8(address & 0x1FFFFFF, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM116 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess16(address | 0);
    this.cartridge.writeROM16(address & 0x1FFFFFE, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM132 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess32(address | 0);
    this.cartridge.writeROM32(address & 0x1FFFFFC, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM28 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess8(address | 0);
    this.cartridge.writeROM8(address & 0x1FFFFFF, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM216 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess16(address | 0);
    this.cartridge.writeROM16(address & 0x1FFFFFE, data | 0);
}
GameBoyAdvanceMemory.prototype.writeROM232 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.ROMAccess32(address | 0);
    this.cartridge.writeROM32(address & 0x1FFFFFC, data | 0);
}
GameBoyAdvanceMemory.prototype.writeSRAM8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.SRAMAccess();
    this.saves.writeSRAM(address & 0xFFFF, data | 0);
}
GameBoyAdvanceMemory.prototype.writeSRAM16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.SRAMAccess();
    this.saves.writeSRAM(address & 0xFFFE, (data >> ((address & 0x1) << 3)) & 0xFF);
}
GameBoyAdvanceMemory.prototype.writeSRAM32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.wait.SRAMAccess();
    this.saves.writeSRAM(address & 0xFFFC, (data >> ((address & 0x3) << 3)) & 0xFF);
}
GameBoyAdvanceMemory.prototype.NOP = function (parentObj, data) {
    //Ignore the data write...
}
GameBoyAdvanceMemory.prototype.writeUnused8 = function (address, data) {
    //Ignore the data write...
    this.IOCore.updateCoreSingle();
}
GameBoyAdvanceMemory.prototype.writeUnused16 = function (address, data) {
    //Ignore the data write...
    this.IOCore.updateCoreSingle();
}
GameBoyAdvanceMemory.prototype.writeUnused32 = function (address, data) {
    //Ignore the data write...
    this.IOCore.updateCoreSingle();
}
GameBoyAdvanceMemory.prototype.remapWRAM = function (data) {
    data = data & 0x21;
    if ((data | 0) != (this.WRAMControlFlags | 0)) {
        switch (data | 0) {
            case 0:
                //Mirror Internal RAM to External:
                this.memoryWriter8 = this.memoryWriter8Generated[0];
                this.memoryReader8 = this.memoryReader8Generated[0];
                this.memoryWriter16 = this.memoryWriter16Generated[0];
                this.memoryReader16 = this.memoryReader16Generated[0];
                this.memoryReader16CPU = this.memoryReader16CPUGenerated[0];
                this.memoryWriter32 = this.memoryWriter32Generated[0];
                this.memoryReader32 = this.memoryReader32Generated[0];
                this.memoryReader32CPU = this.memoryReader32CPUGenerated[0];
                break;
            case 0x20:
                //Use External RAM:
                this.memoryWriter8 = this.memoryWriter8Generated[1];
                this.memoryReader8 = this.memoryReader8Generated[1];
                this.memoryWriter16 = this.memoryWriter16Generated[1];
                this.memoryReader16 = this.memoryReader16Generated[1];
                this.memoryReader16CPU = this.memoryReader16CPUGenerated[1];
                this.memoryWriter32 = this.memoryWriter32Generated[1];
                this.memoryReader32 = this.memoryReader32Generated[1];
                this.memoryReader32CPU = this.memoryReader32CPUGenerated[1];
                break;
            default:
                this.memoryWriter8 = this.memoryWriter8Generated[2];
                this.memoryReader8 = this.memoryReader8Generated[2];
                this.memoryWriter16 = this.memoryWriter16Generated[2];
                this.memoryReader16 = this.memoryReader16Generated[2];
                this.memoryReader16CPU = this.memoryReader16CPUGenerated[2];
                this.memoryWriter32 = this.memoryWriter32Generated[2];
                this.memoryReader32 = this.memoryReader32Generated[2];
                this.memoryReader32CPU = this.memoryReader32CPUGenerated[2];
        }
        this.WRAMControlFlags = data | 0;
    }
}
GameBoyAdvanceMemory.prototype.readBIOS8 = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000) {
        this.IOCore.updateCoreSingle();
        if ((this.cpu.registers[15] | 0) < 0x4000) {
            //If reading from BIOS while executing it:
            this.lastBIOSREAD = this.cpu.getCurrentFetchValue() | 0;
            data = this.BIOS[address & 0x3FFF] | 0;
        }
        else {
            //Not allowed to read from BIOS while executing outside of it:
            data = (this.lastBIOSREAD >> ((address & 0x3) << 3)) & 0xFF;
        }
    }
    else {
        data = this.readUnused8(address | 0) | 0;
    }
    return data | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceMemory.prototype.readBIOS16 = function (address) {
        address = address | 0;
        var data = 0;
        if ((address | 0) < 0x4000) {
            address >>= 1;
            this.IOCore.updateCoreSingle();
            if ((this.cpu.registers[15] | 0) < 0x4000) {
                //If reading from BIOS while executing it:
                this.lastBIOSREAD = this.cpu.getCurrentFetchValue() | 0;
                data = this.BIOS16[address & 0x1FFF] | 0;
            }
            else {
                //Not allowed to read from BIOS while executing outside of it:
                data = (this.lastBIOSREAD >> ((address & 0x1) << 4)) & 0xFFFF;
            }
        }
        else {
            data = this.readUnused16(address | 0) | 0;
        }
        return data | 0;
    }
    GameBoyAdvanceMemory.prototype.readBIOS16CPU = function (address) {
        address = address | 0;
        var data = 0;
        if ((address | 0) < 0x4000) {
            address >>= 1;
            this.wait.singleClockCPU();
            //If reading from BIOS while executing it:
            this.lastBIOSREAD = this.cpu.getCurrentFetchValue() | 0;
            data = this.BIOS16[address & 0x1FFF] | 0;
        }
        else {
            data = this.readUnused16CPU(address | 0) | 0;
        }
        return data | 0;
    }
    GameBoyAdvanceMemory.prototype.readBIOS32 = function (address) {
        address = address | 0;
        var data = 0;
        if ((address | 0) < 0x4000) {
            address >>= 2;
            this.IOCore.updateCoreSingle();
            if ((this.cpu.registers[15] | 0) < 0x4000) {
                //If reading from BIOS while executing it:
                this.lastBIOSREAD = this.cpu.getCurrentFetchValue() | 0;
                data = this.BIOS32[address & 0xFFF] | 0;
            }
            else {
                //Not allowed to read from BIOS while executing outside of it:
                data = this.lastBIOSREAD | 0;
            }
        }
        else {
            data = this.readUnused32(address | 0) | 0;
        }
        return data | 0;
    }
    GameBoyAdvanceMemory.prototype.readBIOS32CPU = function (address) {
        address = address | 0;
        var data = 0;
        if ((address | 0) < 0x4000) {
            address >>= 2;
            this.wait.singleClockCPU();
            //If reading from BIOS while executing it:
            this.lastBIOSREAD = this.cpu.getCurrentFetchValue() | 0;
            data = this.BIOS32[address & 0xFFF] | 0;
        }
        else {
            data = this.readUnused32CPU(address | 0) | 0;
        }
        return data | 0;
    }
}
else {
    GameBoyAdvanceMemory.prototype.readBIOS16 = function (address) {
        address = address | 0;
        if ((address | 0) < 0x4000) {
            this.IOCore.updateCoreSingle();
            if (this.cpu.registers[15] < 0x4000) {
                //If reading from BIOS while executing it:
                this.lastBIOSREAD = this.cpu.getCurrentFetchValue();
                return this.BIOS[address] | (this.BIOS[address | 1] << 8);
            }
            else {
                //Not allowed to read from BIOS while executing outside of it:
                return (this.lastBIOSREAD >> ((address & 0x1) << 4)) & 0xFFFF;
            }
        }
        else {
            return this.readUnused16(address);
        }
    }
    GameBoyAdvanceMemory.prototype.readBIOS16CPU = function (address) {
        address = address | 0;
        if ((address | 0) < 0x4000) {
            this.wait.singleClockCPU();
            //If reading from BIOS while executing it:
            this.lastBIOSREAD = this.cpu.getCurrentFetchValue();
            return this.BIOS[address] | (this.BIOS[address | 1] << 8);
        }
        else {
            return this.readUnused16CPU(address);
        }
    }
    GameBoyAdvanceMemory.prototype.readBIOS32 = function (address) {
        address = address | 0;
        if ((address | 0) < 0x4000) {
            this.IOCore.updateCoreSingle();
            if (this.cpu.registers[15] < 0x4000) {
                //If reading from BIOS while executing it:
                this.lastBIOSREAD = this.cpu.getCurrentFetchValue();
                return this.BIOS[address] | (this.BIOS[address | 1] << 8) | (this.BIOS[address | 2] << 16)  | (this.BIOS[address | 3] << 24);
            }
            else {
                //Not allowed to read from BIOS while executing outside of it:
                return this.lastBIOSREAD;
            }
        }
        else {
            return this.readUnused32(address);
        }
    }
    GameBoyAdvanceMemory.prototype.readBIOS32CPU = function (address) {
        address = address | 0;
        if ((address | 0) < 0x4000) {
            this.wait.singleClockCPU();
            //If reading from BIOS while executing it:
            this.lastBIOSREAD = this.cpu.getCurrentFetchValue();
            return this.BIOS[address] | (this.BIOS[address | 1] << 8) | (this.BIOS[address | 2] << 16)  | (this.BIOS[address | 3] << 24);
        }
        else {
            return this.readUnused32CPU(address);
        }
    }
}
GameBoyAdvanceMemory.prototype.readExternalWRAM8 = function (address) {
    address = address | 0;
    //External WRAM:
    this.wait.WRAMAccess8();
    return this.externalRAM[address & 0x3FFFF] | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceMemory.prototype.readExternalWRAM16 = function (address) {
        address = address | 0;
        //External WRAM:
        this.wait.WRAMAccess16();
        return this.externalRAM16[(address >> 1) & 0x1FFFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM16CPU = function (address) {
        address = address | 0;
        //External WRAM:
        this.wait.WRAMAccess16CPU();
        return this.externalRAM16[(address >> 1) & 0x1FFFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM32 = function (address) {
        address = address | 0;
        //External WRAM:
        this.wait.WRAMAccess32();
        return this.externalRAM32[(address >> 2) & 0xFFFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM32CPU = function (address) {
        address = address | 0;
        //External WRAM:
        this.wait.WRAMAccess32CPU();
        return this.externalRAM32[(address >> 2) & 0xFFFF] | 0;
    }
}
else {
    GameBoyAdvanceMemory.prototype.readExternalWRAM16 = function (address) {
        //External WRAM:
        this.wait.WRAMAccess16();
        return this.externalRAM[address & 0x3FFFE] | (this.externalRAM[(address | 1) & 0x3FFFF] << 8);
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM16CPU = function (address) {
        //External WRAM:
        this.wait.WRAMAccess16CPU();
        return this.externalRAM[address & 0x3FFFE] | (this.externalRAM[(address | 1) & 0x3FFFF] << 8);
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM32 = function (address) {
        //External WRAM:
        this.wait.WRAMAccess32();
        return this.externalRAM[address & 0x3FFFC] | (this.externalRAM[(address | 1) & 0x3FFFD] << 8) | (this.externalRAM[(address | 2) & 0x3FFFE] << 16) | (this.externalRAM[(address | 3) & 0x3FFFF] << 24);
    }
    GameBoyAdvanceMemory.prototype.readExternalWRAM32CPU = function (address) {
        //External WRAM:
        this.wait.WRAMAccess32CPU();
        return this.externalRAM[address & 0x3FFFC] | (this.externalRAM[(address | 1) & 0x3FFFD] << 8) | (this.externalRAM[(address | 2) & 0x3FFFE] << 16) | (this.externalRAM[(address | 3) & 0x3FFFF] << 24);
    }
}
GameBoyAdvanceMemory.prototype.readInternalWRAM8 = function (address) {
    address = address | 0;
    //Internal WRAM:
    this.IOCore.updateCoreSingle();
    return this.internalRAM[address & 0x7FFF] | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceMemory.prototype.readInternalWRAM16 = function (address) {
        address = address | 0;
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        return this.internalRAM16[(address >> 1) & 0x3FFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM16CPU = function (address) {
        address = address | 0;
        //Internal WRAM:
        this.wait.singleClockCPU();
        return this.internalRAM16[(address >> 1) & 0x3FFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM32 = function (address) {
        address = address | 0;
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        return this.internalRAM32[(address >> 2) & 0x1FFF] | 0;
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM32CPU = function (address) {
        address = address | 0;
        //Internal WRAM:
        this.wait.singleClockCPU();
        return this.internalRAM32[(address >> 2) & 0x1FFF] | 0;
    }
}
else {
    GameBoyAdvanceMemory.prototype.readInternalWRAM16 = function (address) {
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        return this.internalRAM[address & 0x7FFE] | (this.internalRAM[(address | 1) & 0x7FFF] << 8);
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM16CPU = function (address) {
        //Internal WRAM:
        this.wait.singleClockCPU();
        return this.internalRAM[address & 0x7FFE] | (this.internalRAM[(address | 1) & 0x7FFF] << 8);
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM32 = function (address) {
        //Internal WRAM:
        this.IOCore.updateCoreSingle();
        return this.internalRAM[address & 0x7FFC] | (this.internalRAM[(address | 1) & 0x7FFD] << 8) | (this.internalRAM[(address | 2) & 0x7FFE] << 16) | (this.internalRAM[(address | 3) & 0x7FFF] << 24);
    }
    GameBoyAdvanceMemory.prototype.readInternalWRAM32CPU = function (address) {
        //Internal WRAM:
        this.wait.singleClockCPU();
        return this.internalRAM[address & 0x7FFC] | (this.internalRAM[(address | 1) & 0x7FFD] << 8) | (this.internalRAM[(address | 2) & 0x7FFE] << 16) | (this.internalRAM[(address | 3) & 0x7FFF] << 24);
    }
}
GameBoyAdvanceMemory.prototype.readIODispatch8 = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000304) {
        //IO Read:
        this.IOCore.updateCoreSingle();
        data = this.readIO8[address & 0x3FF](this) | 0;
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.IOCore.updateCoreSingle();
        data = this.wait.readConfigureWRAM8(address | 0) | 0;
    }
    else {
        data = this.readUnused8(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceMemory.prototype.readIODispatch16 = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000303) {
        //IO Read:
        this.IOCore.updateCoreSingle();
        address >>= 1;
        data = this.readIO16[address & 0x1FF](this) | 0;
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.IOCore.updateCoreSingle();
        data = this.wait.readConfigureWRAM16(address | 0) | 0;
    }
    else {
        data = this.readUnused16(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceMemory.prototype.readIODispatch16CPU = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000303) {
        //IO Read:
        this.wait.singleClockCPU();
        address >>= 1;
        data = this.readIO16[address & 0x1FF](this) | 0;
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.wait.singleClockCPU();
        data = this.wait.readConfigureWRAM16(address | 0) | 0;
    }
    else {
        data = this.readUnused16CPU(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceMemory.prototype.readIODispatch32 = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000301) {
        //IO Read:
        this.IOCore.updateCoreSingle();
        address >>= 2;
        data = this.readIO32[address & 0xFF](this) | 0;
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.IOCore.updateCoreSingle();
        data = this.wait.readConfigureWRAM32() | 0;
    }
    else {
        data = this.readUnused32(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceMemory.prototype.readIODispatch32CPU = function (address) {
    address = address | 0;
    var data = 0;
    if ((address | 0) < 0x4000301) {
        //IO Read:
        this.wait.singleClockCPU();
        address >>= 2;
        data = this.readIO32[address & 0xFF](this) | 0;
    }
    else if ((address & 0x4000800) == 0x4000800) {
        //WRAM wait state control:
        this.wait.singleClockCPU();
        data = this.wait.readConfigureWRAM32() | 0;
    }
    else {
        data = this.readUnused32CPU(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceMemory.prototype.readVRAM8 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess8();
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.gfx.readVRAM(address & 0x1FFFF) | 0;
}
GameBoyAdvanceMemory.prototype.readVRAM16 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16();
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.gfx.readVRAM16(address & 0x1FFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readVRAM16CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16();
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.gfx.readVRAM16(address & 0x1FFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readVRAM32 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32();
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.gfx.readVRAM32(address & 0x1FFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readVRAM32CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32CPU();
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.gfx.readVRAM32(address & 0x1FFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readOAM8 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess8();
    return this.gfx.readOAM(address & 0x3FF) | 0;
}
GameBoyAdvanceMemory.prototype.readOAM16 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess16();
    return this.gfx.readOAM16(address & 0x3FE) | 0;
}
GameBoyAdvanceMemory.prototype.readOAM16CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess16CPU();
    return this.gfx.readOAM16(address & 0x3FE) | 0;
}
GameBoyAdvanceMemory.prototype.readOAM32 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess32();
    return this.gfx.readOAM32(address & 0x3FC) | 0;
}
GameBoyAdvanceMemory.prototype.readOAM32CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.OAMAccess32CPU();
    return this.gfx.readOAM32(address & 0x3FC) | 0;
}
GameBoyAdvanceMemory.prototype.readPalette8 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess8();
    return this.gfx.readPalette(address & 0x3FF);
}
GameBoyAdvanceMemory.prototype.readPalette16 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16();
    return this.gfx.readPalette16(address & 0x3FE);
}
GameBoyAdvanceMemory.prototype.readPalette16CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess16CPU();
    return this.gfx.readPalette16(address & 0x3FE);
}
GameBoyAdvanceMemory.prototype.readPalette32 = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32();
    return this.gfx.readPalette32(address & 0x3FC);
}
GameBoyAdvanceMemory.prototype.readPalette32CPU = function (address) {
    address = address | 0;
    this.IOCore.updateGraphicsClocking();
    this.wait.VRAMAccess32CPU();
    return this.gfx.readPalette32(address & 0x3FC);
}
GameBoyAdvanceMemory.prototype.readROM08 = function (address) {
    address = address | 0;
    this.wait.ROMAccess8(address | 0);
    return this.cartridge.readROM8(address & 0x1FFFFFF) | 0;
}
GameBoyAdvanceMemory.prototype.readROM016 = function (address) {
    address = address | 0;
    this.wait.ROMAccess16(address | 0);
    return this.cartridge.readROM16(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM016CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess16CPU(address | 0);
    return this.cartridge.readROM16(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM032 = function (address) {
    address = address | 0;
    this.wait.ROMAccess32(address | 0);
    return this.cartridge.readROM32(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readROM032CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess32CPU(address | 0);
    return this.cartridge.readROM32(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readROM18 = function (address) {
    address = address | 0;
    this.wait.ROMAccess8(address | 0);
    return this.cartridge.readROM8(address & 0x1FFFFFF) | 0;
}
GameBoyAdvanceMemory.prototype.readROM116 = function (address) {
    address = address | 0;
    this.wait.ROMAccess16(address | 0);
    return this.cartridge.readROM16(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM116CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess16CPU(address | 0);
    return this.cartridge.readROM16(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM132 = function (address) {
    address = address | 0;
    this.wait.ROMAccess32(address | 0);
    return this.cartridge.readROM32(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readROM132CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess32CPU(address | 0);
    return this.cartridge.readROM32(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readROM28 = function (address) {
    address = address | 0;
    this.wait.ROMAccess8(address | 0);
    return this.cartridge.readROM8Space2(address & 0x1FFFFFF) | 0;
}
GameBoyAdvanceMemory.prototype.readROM216 = function (address) {
    address = address | 0;
    this.wait.ROMAccess16(address | 0);
    return this.cartridge.readROM16Space2(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM216CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess16CPU(address | 0);
    return this.cartridge.readROM16Space2(address & 0x1FFFFFE) | 0;
}
GameBoyAdvanceMemory.prototype.readROM232 = function (address) {
    address = address | 0;
    this.wait.ROMAccess32(address | 0);
    return this.cartridge.readROM32Space2(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readROM232CPU = function (address) {
    address = address | 0;
    this.wait.ROMAccess32CPU(address | 0);
    return this.cartridge.readROM32Space2(address & 0x1FFFFFC) | 0;
}
GameBoyAdvanceMemory.prototype.readSRAM8 = function (address) {
    address = address | 0;
    this.wait.SRAMAccess();
    return this.saves.readSRAM(address & 0xFFFF) | 0;
}
GameBoyAdvanceMemory.prototype.readSRAM16 = function (address) {
    address = address | 0;
    this.wait.SRAMAccess();
    return ((this.saves.readSRAM(address & 0xFFFE) | 0) * 0x101) | 0;
}
GameBoyAdvanceMemory.prototype.readSRAM16CPU = function (address) {
    address = address | 0;
    this.wait.SRAMAccessCPU();
    return ((this.saves.readSRAM(address & 0xFFFE) | 0) * 0x101) | 0;
}
GameBoyAdvanceMemory.prototype.readSRAM32 = function (address) {
    address = address | 0;
    this.wait.SRAMAccess();
    return ((this.saves.readSRAM(address & 0xFFFC) | 0) * 0x1010101) | 0;
}
GameBoyAdvanceMemory.prototype.readSRAM32CPU = function (address) {
    address = address | 0;
    this.wait.SRAMAccessCPU();
    return ((this.saves.readSRAM(address & 0xFFFC) | 0) * 0x1010101) | 0;
}
GameBoyAdvanceMemory.prototype.readZero = function (parentObj) {
    return 0;
}
GameBoyAdvanceMemory.prototype.readUnused8 = function (address) {
    address = address | 0;
    this.IOCore.updateCoreSingle();
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? this.cpu : this.dma;
    return (controller.getCurrentFetchValue() >> ((address & 0x3) << 3)) & 0xFF;
}
GameBoyAdvanceMemory.prototype.readUnused16IO1 = function (parentObj) {
    parentObj.IOCore.updateCoreSingle();
    var controller = ((parentObj.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return controller.getCurrentFetchValue() & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.readUnused16IO2 = function (parentObj) {
    parentObj.IOCore.updateCoreSingle();
    var controller = ((parentObj.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return (controller.getCurrentFetchValue() >> 16) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.readUnused16 = function (address) {
    address = address | 0;
    this.IOCore.updateCoreSingle();
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? this.cpu : this.dma;
    return (controller.getCurrentFetchValue() >> ((address & 0x2) << 3)) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.readUnused16CPU = function (address) {
    address = address | 0;
    this.wait.singleClockCPU();
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? this.cpu : this.dma;
    return (controller.getCurrentFetchValue() >> ((address & 0x2) << 3)) & 0xFFFF;
}
GameBoyAdvanceMemory.prototype.readUnused32IO = function (parentObj) {
    parentObj.IOCore.updateCoreSingle();
    var controller = ((parentObj.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return controller.getCurrentFetchValue() | 0;
}
GameBoyAdvanceMemory.prototype.readUnused32 = function (address) {
    address = address | 0;
    this.IOCore.updateCoreSingle();
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? this.cpu : this.dma;
    return controller.getCurrentFetchValue() | 0;
}
GameBoyAdvanceMemory.prototype.readUnused32CPU = function (address) {
    address = address | 0;
    this.wait.singleClockCPU();
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? this.cpu : this.dma;
    return controller.getCurrentFetchValue() | 0;
}
GameBoyAdvanceMemory.prototype.readUnused0 = function (parentObj) {
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return controller.getCurrentFetchValue() & 0xFF;
}
GameBoyAdvanceMemory.prototype.readUnused1 = function (parentObj) {
    var controller = ((this.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return (controller.getCurrentFetchValue() >> 8) & 0xFF;
}
GameBoyAdvanceMemory.prototype.readUnused2 = function (parentObj) {
    var controller = ((parentObj.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return (controller.getCurrentFetchValue() >> 16) & 0xFF;
}
GameBoyAdvanceMemory.prototype.readUnused3 = function (parentObj) {
    var controller = ((parentObj.IOCore.systemStatus | 0) == 0) ? parentObj.cpu : parentObj.dma;
    return controller.getCurrentFetchValue() >>> 24;
}
GameBoyAdvanceMemory.prototype.loadBIOS = function () {
    //Ensure BIOS is of correct length:
    if ((this.IOCore.BIOS.length | 0) == 0x4000) {
        this.IOCore.BIOSFound = true;
        for (var index = 0; (index | 0) < 0x4000; index = ((index | 0) + 1) | 0) {
            this.BIOS[index & 0x3FFF] = this.IOCore.BIOS[index & 0x3FFF] & 0xFF;
        }
    }
    else {
        this.IOCore.BIOSFound = false;
    }
}