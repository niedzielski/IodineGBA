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
function GameBoyAdvanceMemoryDispatchGenerator(memory) {
    this.memory = memory;
}
GameBoyAdvanceMemoryDispatchGenerator.prototype.generateMemoryReadIO8 = function () {
    var readIO = [];
    //4000000h - DISPCNT - LCD Control (Read/Write)
    readIO[0] = function (parentObj) {
        return parentObj.gfx.readDISPCNT0() | 0;
    }
    //4000001h - DISPCNT - LCD Control (Read/Write)
    readIO[0x1] = function (parentObj) {
        return parentObj.gfx.readDISPCNT1() | 0;
    }
    //4000002h - Undocumented - Green Swap (R/W)
    readIO[0x2] = function (parentObj) {
        return parentObj.gfx.readGreenSwap() | 0;
    }
    //4000003h - Undocumented - Green Swap (R/W)
    readIO[0x3] = this.memory.readZero;
    //4000004h - DISPSTAT - General LCD Status (Read/Write)
    readIO[0x4] = function (parentObj) {
        parentObj.IOCore.updateGraphicsClocking();
        return parentObj.gfx.readDISPSTAT0() | 0;
    }
    //4000005h - DISPSTAT - General LCD Status (Read/Write)
    readIO[0x5] = function (parentObj) {
        parentObj.IOCore.updateGraphicsClocking();
        return parentObj.gfx.readDISPSTAT1() | 0;
    }
    //4000006h - VCOUNT - Vertical Counter (Read only)
    readIO[0x6] = function (parentObj) {
        parentObj.IOCore.updateGraphicsClocking();
        return parentObj.gfx.readVCOUNT() | 0;
    }
    //4000007h - VCOUNT - Vertical Counter (Read only)
    readIO[0x7] = this.memory.readZero;
    //4000008h - BG0CNT - BG0 Control (R/W) (BG Modes 0,1 only)
    readIO[0x8] = function (parentObj) {
        return parentObj.gfx.readBG0CNT0() | 0;
    }
    //4000009h - BG0CNT - BG0 Control (R/W) (BG Modes 0,1 only)
    readIO[0x9] = function (parentObj) {
        return parentObj.gfx.readBG0CNT1() | 0;
    }
    //400000Ah - BG1CNT - BG1 Control (R/W) (BG Modes 0,1 only)
    readIO[0xA] = function (parentObj) {
        return parentObj.gfx.readBG1CNT0() | 0;
    }
    //400000Bh - BG1CNT - BG1 Control (R/W) (BG Modes 0,1 only)
    readIO[0xB] = function (parentObj) {
        return parentObj.gfx.readBG1CNT1() | 0;
    }
    //400000Ch - BG2CNT - BG2 Control (R/W) (BG Modes 0,1,2 only)
    readIO[0xC] = function (parentObj) {
        return parentObj.gfx.readBG2CNT0() | 0;
    }
    //400000Dh - BG2CNT - BG2 Control (R/W) (BG Modes 0,1,2 only)
    readIO[0xD] = function (parentObj) {
        return parentObj.gfx.readBG2CNT1() | 0;
    }
    //400000Eh - BG3CNT - BG3 Control (R/W) (BG Modes 0,2 only)
    readIO[0xE] = function (parentObj) {
        return parentObj.gfx.readBG3CNT0() | 0;
    }
    //400000Fh - BG3CNT - BG3 Control (R/W) (BG Modes 0,2 only)
    readIO[0xF] = function (parentObj) {
        return parentObj.gfx.readBG3CNT1() | 0;
    }
    //4000010h through 4000047h - WRITE ONLY
    this.fillReadTableUnused8(readIO, 0x10, 0x47);
    //4000048h - WININ - Control of Inside of Window(s) (R/W)
    readIO[0x48] = function (parentObj) {
        return parentObj.gfx.readWININ0() | 0;
    }
    //4000049h - WININ - Control of Inside of Window(s) (R/W)
    readIO[0x49] = function (parentObj) {
        return parentObj.gfx.readWININ1() | 0;
    }
    //400004Ah- WINOUT - Control of Outside of Windows & Inside of OBJ Window (R/W)
    readIO[0x4A] = function (parentObj) {
        return parentObj.gfx.readWINOUT0() | 0;
    }
    //400004AB- WINOUT - Control of Outside of Windows & Inside of OBJ Window (R/W)
    readIO[0x4B] = function (parentObj) {
        return parentObj.gfx.readWINOUT1() | 0;
    }
    //400004Ch - MOSAIC - Mosaic Size (W)
    readIO[0x4C] = this.memory.readUnused0;
    //400004Dh - MOSAIC - Mosaic Size (W)
    readIO[0x4D] = this.memory.readUnused1;
    //400004Eh - NOT USED - ZERO
    readIO[0x4E] = this.memory.readUnused2;
    //400004Fh - NOT USED - ZERO
    readIO[0x4F] = this.memory.readUnused3;
    //4000050h - BLDCNT - Color Special Effects Selection (R/W)
    readIO[0x50] = function (parentObj) {
        return parentObj.gfx.readBLDCNT0() | 0;
    }
    //4000051h - BLDCNT - Color Special Effects Selection (R/W)
    readIO[0x51] = function (parentObj) {
        return parentObj.gfx.readBLDCNT1() | 0;
    }
    //4000052h - BLDALPHA - Alpha Blending Coefficients (R/W)
    readIO[0x52] = function (parentObj) {
        return parentObj.gfx.readBLDALPHA0() | 0;
    }
    //4000053h - BLDALPHA - Alpha Blending Coefficients (R/W)
    readIO[0x53] = function (parentObj) {
        return parentObj.gfx.readBLDALPHA1() | 0;
    }
    //4000054h through 400005Fh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x54, 0x5F);
    //4000060h - SOUND1CNT_L (NR10) - Channel 1 Sweep register (R/W)
    readIO[0x60] = function (parentObj) {
        //NR10:
        return parentObj.sound.readSOUND1CNT_L() | 0;
    }
    //4000061h - NOT USED - ZERO
    readIO[0x61] = this.memory.readZero;
    //4000062h - SOUND1CNT_H (NR11, NR12) - Channel 1 Duty/Len/Envelope (R/W)
    readIO[0x62] = function (parentObj) {
        //NR11:
        return parentObj.sound.readSOUND1CNT_H0() | 0;
    }
    //4000063h - SOUND1CNT_H (NR11, NR12) - Channel 1 Duty/Len/Envelope (R/W)
    readIO[0x63] = function (parentObj) {
        //NR12:
        return parentObj.sound.readSOUND1CNT_H1() | 0;
    }
    //4000064h - SOUND1CNT_X (NR13, NR14) - Channel 1 Frequency/Control (R/W)
    readIO[0x64] = this.memory.readZero;
    //4000065h - SOUND1CNT_X (NR13, NR14) - Channel 1 Frequency/Control (R/W)
    readIO[0x65] = function (parentObj) {
        //NR14:
        return parentObj.sound.readSOUND1CNT_X() | 0;
    }
    //4000066h - NOT USED - ZERO
    readIO[0x66] = this.memory.readZero;
    //4000067h - NOT USED - ZERO
    readIO[0x67] = this.memory.readZero;
    //4000068h - SOUND2CNT_L (NR21, NR22) - Channel 2 Duty/Length/Envelope (R/W)
    readIO[0x68] = function (parentObj) {
        //NR21:
        return parentObj.sound.readSOUND2CNT_L0() | 0;
    }
    //4000069h - SOUND2CNT_L (NR21, NR22) - Channel 2 Duty/Length/Envelope (R/W)
    readIO[0x69] = function (parentObj) {
        //NR22:
        return parentObj.sound.readSOUND2CNT_L1() | 0;
    }
    //400006Ah - NOT USED - ZERO
    readIO[0x6A] = this.memory.readZero;
    //400006Bh - NOT USED - ZERO
    readIO[0x6B] = this.memory.readZero;
    //400006Ch - SOUND2CNT_H (NR23, NR24) - Channel 2 Frequency/Control (R/W)
    readIO[0x6C] = this.memory.readZero;
    //400006Dh - SOUND2CNT_H (NR23, NR24) - Channel 2 Frequency/Control (R/W)
    readIO[0x6D] = function (parentObj) {
        //NR24:
        return parentObj.sound.readSOUND2CNT_H() | 0;
    }
    //400006Eh - NOT USED - ZERO
    readIO[0x6E] = this.memory.readZero;
    //400006Fh - NOT USED - ZERO
    readIO[0x6F] = this.memory.readZero;
    //4000070h - SOUND3CNT_L (NR30) - Channel 3 Stop/Wave RAM select (R/W)
    readIO[0x70] = function (parentObj) {
        //NR30:
        return parentObj.sound.readSOUND3CNT_L() | 0;
    }
    //4000071h - SOUND3CNT_L (NR30) - Channel 3 Stop/Wave RAM select (R/W)
    readIO[0x71] = this.memory.readZero;
    //4000072h - SOUND3CNT_H (NR31, NR32) - Channel 3 Length/Volume (R/W)
    readIO[0x72] = this.memory.readZero;
    //4000073h - SOUND3CNT_H (NR31, NR32) - Channel 3 Length/Volume (R/W)
    readIO[0x73] = function (parentObj) {
        //NR32:
        return parentObj.sound.readSOUND3CNT_H() | 0;
    }
    //4000074h - SOUND3CNT_X (NR33, NR34) - Channel 3 Frequency/Control (R/W)
    readIO[0x74] = this.memory.readZero;
    //4000075h - SOUND3CNT_X (NR33, NR34) - Channel 3 Frequency/Control (R/W)
    readIO[0x75] = function (parentObj) {
        //NR34:
        return parentObj.sound.readSOUND3CNT_X() | 0;
    }
    //4000076h - NOT USED - ZERO
    readIO[0x76] = this.memory.readZero;
    //4000077h - NOT USED - ZERO
    readIO[0x77] = this.memory.readZero;
    //4000078h - SOUND4CNT_L (NR41, NR42) - Channel 4 Length/Envelope (R/W)
    readIO[0x78] = this.memory.readZero;
    //4000079h - SOUND4CNT_L (NR41, NR42) - Channel 4 Length/Envelope (R/W)
    readIO[0x79] = function (parentObj) {
        //NR42:
        return parentObj.sound.readSOUND4CNT_L() | 0;
    }
    //400007Ah - NOT USED - ZERO
    readIO[0x7A] = this.memory.readZero;
    //400007Bh - NOT USED - ZERO
    readIO[0x7B] = this.memory.readZero;
    //400007Ch - SOUND4CNT_H (NR43, NR44) - Channel 4 Frequency/Control (R/W)
    readIO[0x7C] = function (parentObj) {
        //NR43:
        return parentObj.sound.readSOUND4CNT_H0() | 0;
    }
    //400007Dh - SOUND4CNT_H (NR43, NR44) - Channel 4 Frequency/Control (R/W)
    readIO[0x7D] = function (parentObj) {
        //NR44:
        return parentObj.sound.readSOUND4CNT_H1() | 0;
    }
    //400007Eh - NOT USED - ZERO
    readIO[0x7E] = this.memory.readZero;
    //400007Fh - NOT USED - ZERO
    readIO[0x7F] = this.memory.readZero;
    //4000080h - SOUNDCNT_L (NR50, NR51) - Channel L/R Volume/Enable (R/W)
    readIO[0x80] = function (parentObj) {
        //NR50:
        return parentObj.sound.readSOUNDCNT_L0() | 0;
    }
    //4000081h - SOUNDCNT_L (NR50, NR51) - Channel L/R Volume/Enable (R/W)
    readIO[0x81] = function (parentObj) {
        //NR51:
        return parentObj.sound.readSOUNDCNT_L1() | 0;
    }
    //4000082h - SOUNDCNT_H (GBA only) - DMA Sound Control/Mixing (R/W)
    readIO[0x82] = function (parentObj) {
        return parentObj.sound.readSOUNDCNT_H0() | 0;
    }
    //4000083h - SOUNDCNT_H (GBA only) - DMA Sound Control/Mixing (R/W)
    readIO[0x83] = function (parentObj) {
        return parentObj.sound.readSOUNDCNT_H1() | 0;
    }
    //4000084h - SOUNDCNT_X (NR52) - Sound on/off (R/W)
    readIO[0x84] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readSOUNDCNT_X() | 0;
    }
    //4000085h - NOT USED - ZERO
    readIO[0x85] = this.memory.readZero;
    //4000086h - NOT USED - ZERO
    readIO[0x86] = this.memory.readZero;
    //4000087h - NOT USED - ZERO
    readIO[0x87] = this.memory.readZero;
    //4000088h - SOUNDBIAS - Sound PWM Control (R/W, see below)
    readIO[0x88] = function (parentObj) {
        return parentObj.sound.readSOUNDBIAS0() | 0;
    }
    //4000089h - SOUNDBIAS - Sound PWM Control (R/W, see below)
    readIO[0x89] = function (parentObj) {
        return parentObj.sound.readSOUNDBIAS1() | 0;
    }
    //400008Ah - NOT USED - ZERO
    readIO[0x8A] = this.memory.readZero;
    //400008Bh - NOT USED - ZERO
    readIO[0x8B] = this.memory.readZero;
    //400008Ch - NOT USED - GLITCHED
    readIO[0x8C] = this.memory.readUnused0;
    //400008Dh - NOT USED - GLITCHED
    readIO[0x8D] = this.memory.readUnused1;
    //400008Eh - NOT USED - GLITCHED
    readIO[0x8E] = this.memory.readUnused2;
    //400008Fh - NOT USED - GLITCHED
    readIO[0x8F] = this.memory.readUnused3;
    //4000090h - WAVE_RAM0_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x90] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(0) | 0;
    }
    //4000091h - WAVE_RAM0_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x91] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(1) | 0;
    }
    //4000092h - WAVE_RAM0_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x92] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(2) | 0;
    }
    //4000093h - WAVE_RAM0_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x93] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(3) | 0;
    }
    //4000094h - WAVE_RAM1_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x94] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(4) | 0;
    }
    //4000095h - WAVE_RAM1_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x95] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(5) | 0;
    }
    //4000096h - WAVE_RAM1_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x96] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(6) | 0;
    }
    //4000097h - WAVE_RAM1_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x97] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(7) | 0;
    }
    //4000098h - WAVE_RAM2_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x98] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(8) | 0;
    }
    //4000099h - WAVE_RAM2_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x99] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(9) | 0;
    }
    //400009Ah - WAVE_RAM2_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9A] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(10) | 0;
    }
    //400009Bh - WAVE_RAM2_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9B] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(11) | 0;
    }
    //400009Ch - WAVE_RAM3_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9C] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(12) | 0;
    }
    //400009Dh - WAVE_RAM3_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9D] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(13) | 0;
    }
    //400009Eh - WAVE_RAM3_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9E] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(14) | 0;
    }
    //400009Fh - WAVE_RAM3_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9F] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(15) | 0;
    }
    //40000A0h through 40000B9h - WRITE ONLY
    this.fillReadTableUnused8(readIO, 0xA0, 0xB9);
    //40000BAh - DMA0CNT_H - DMA 0 Control (R/W)
    readIO[0xBA] = function (parentObj) {
        return parentObj.dma.readDMAControl0(0) | 0;
    }
    //40000BBh - DMA0CNT_H - DMA 0 Control (R/W)
    readIO[0xBB] = function (parentObj) {
        return parentObj.dma.readDMAControl1(0) | 0;
    }
    //40000BCh through 40000C5h - WRITE ONLY
    this.fillReadTableUnused8(readIO, 0xBC, 0xC5);
    //40000C6h - DMA1CNT_H - DMA 1 Control (R/W)
    readIO[0xC6] = function (parentObj) {
        return parentObj.dma.readDMAControl0(1) | 0;
    }
    //40000C7h - DMA1CNT_H - DMA 1 Control (R/W)
    readIO[0xC7] = function (parentObj) {
        return parentObj.dma.readDMAControl1(1) | 0;
    }
    //40000C8h through 40000D1h - WRITE ONLY
    this.fillReadTableUnused8(readIO, 0xC8, 0xD1);
    //40000D2h - DMA2CNT_H - DMA 2 Control (R/W)
    readIO[0xD2] = function (parentObj) {
        return parentObj.dma.readDMAControl0(2) | 0;
    }
    //40000D3h - DMA2CNT_H - DMA 2 Control (R/W)
    readIO[0xD3] = function (parentObj) {
        return parentObj.dma.readDMAControl1(2) | 0;
    }
    //40000D4h through 40000DDh - WRITE ONLY
    this.fillReadTableUnused8(readIO, 0xD4, 0xDD);
    //40000DEh - DMA3CNT_H - DMA 3 Control (R/W)
    readIO[0xDE] = function (parentObj) {
        return parentObj.dma.readDMAControl0(3) | 0;
    }
    //40000DFh - DMA3CNT_H - DMA 3 Control (R/W)
    readIO[0xDF] = function (parentObj) {
        return parentObj.dma.readDMAControl1(3) | 0;
    }
    //40000E0h through 40000FFh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0xE0, 0xFF);
    //4000100h - TM0CNT_L - Timer 0 Counter/Reload (R/W)
    readIO[0x100] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM0CNT_L0() | 0;
    }
    //4000101h - TM0CNT_L - Timer 0 Counter/Reload (R/W)
    readIO[0x101] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM0CNT_L1() | 0;
    }
    //4000102h - TM0CNT_H - Timer 0 Control (R/W)
    readIO[0x102] = function (parentObj) {
        return parentObj.timer.readTM0CNT_H() | 0;
    }
    //4000103h - TM0CNT_H - Timer 0 Control (R/W)
    readIO[0x103] = this.memory.readZero;
    //4000104h - TM1CNT_L - Timer 1 Counter/Reload (R/W)
    readIO[0x104] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM1CNT_L0() | 0;
    }
    //4000105h - TM1CNT_L - Timer 1 Counter/Reload (R/W)
    readIO[0x105] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM1CNT_L1() | 0;
    }
    //4000106h - TM1CNT_H - Timer 1 Control (R/W)
    readIO[0x106] = function (parentObj) {
        return parentObj.timer.readTM1CNT_H() | 0;
    }
    //4000107h - TM1CNT_H - Timer 1 Control (R/W)
    readIO[0x107] = this.memory.readZero;
    //4000108h - TM2CNT_L - Timer 2 Counter/Reload (R/W)
    readIO[0x108] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM2CNT_L0() | 0;
    }
    //4000109h - TM2CNT_L - Timer 2 Counter/Reload (R/W)
    readIO[0x109] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM2CNT_L1() | 0;
    }
    //400010Ah - TM2CNT_H - Timer 2 Control (R/W)
    readIO[0x10A] = function (parentObj) {
        return parentObj.timer.readTM2CNT_H() | 0;
    }
    //400010Bh - TM2CNT_H - Timer 2 Control (R/W)
    readIO[0x10B] = this.memory.readZero;
    //400010Ch - TM3CNT_L - Timer 3 Counter/Reload (R/W)
    readIO[0x10C] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM3CNT_L0() | 0;
    }
    //400010Dh - TM3CNT_L - Timer 3 Counter/Reload (R/W)
    readIO[0x10D] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM3CNT_L1() | 0;
    }
    //400010Eh - TM3CNT_H - Timer 3 Control (R/W)
    readIO[0x10E] = function (parentObj) {
        return parentObj.timer.readTM3CNT_H() | 0;
    }
    //400010Fh - TM3CNT_H - Timer 3 Control (R/W)
    readIO[0x10F] = this.memory.readZero;
    //4000110h through 400011Fh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x110, 0x11F);
    //4000120h - Serial Data A (R/W)
    readIO[0x120] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_A0() | 0;
    }
    //4000121h - Serial Data A (R/W)
    readIO[0x121] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_A1() | 0;
    }
    //4000122h - Serial Data B (R/W)
    readIO[0x122] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_B0() | 0;
    }
    //4000123h - Serial Data B (R/W)
    readIO[0x123] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_B1() | 0;
    }
    //4000124h - Serial Data C (R/W)
    readIO[0x124] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_C0() | 0;
    }
    //4000125h - Serial Data C (R/W)
    readIO[0x125] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_C1() | 0;
    }
    //4000126h - Serial Data D (R/W)
    readIO[0x126] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_D0() | 0;
    }
    //4000127h - Serial Data D (R/W)
    readIO[0x127] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_D1() | 0;
    }
    //4000128h - SIOCNT - SIO Sub Mode Control (R/W)
    readIO[0x128] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIOCNT0() | 0;
    }
    //4000129h - SIOCNT - SIO Sub Mode Control (R/W)
    readIO[0x129] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIOCNT1() | 0;
    }
    //400012Ah - SIOMLT_SEND - Data Send Register (R/W)
    readIO[0x12A] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA8_0() | 0;
    }
    //400012Bh - SIOMLT_SEND - Data Send Register (R/W)
    readIO[0x12B] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA8_1() | 0;
    }
    //400012Ch through 400012Fh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x12C, 0x12F);
    //4000130h - KEYINPUT - Key Status (R)
    readIO[0x130] = function (parentObj) {
        return parentObj.joypad.readKeyStatus0() | 0;
    }
    //4000131h - KEYINPUT - Key Status (R)
    readIO[0x131] = function (parentObj) {
        return parentObj.joypad.readKeyStatus1() | 0;
    }
    //4000132h - KEYCNT - Key Interrupt Control (R/W)
    readIO[0x132] = function (parentObj) {
        return parentObj.joypad.readKeyControl0() | 0;
    }
    //4000133h - KEYCNT - Key Interrupt Control (R/W)
    readIO[0x133] = function (parentObj) {
        return parentObj.joypad.readKeyControl1() | 0;
    }
    //4000134h - RCNT (R/W) - Mode Selection
    readIO[0x134] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readRCNT0() | 0;
    }
    //4000135h - RCNT (R/W) - Mode Selection
    readIO[0x135] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readRCNT1() | 0;
    }
    //4000136h - NOT USED - ZERO
    readIO[0x136] = this.memory.readZero;
    //4000137h - NOT USED - ZERO
    readIO[0x137] = this.memory.readZero;
    //4000138h through 400013Fh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x138, 0x13F);
    //4000140h - JOYCNT - JOY BUS Control Register (R/W)
    readIO[0x140] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYCNT() | 0;
    }
    //4000141h - JOYCNT - JOY BUS Control Register (R/W)
    readIO[0x141] = this.memory.readZero;
    //4000142h - NOT USED - ZERO
    readIO[0x142] = this.memory.readZero;
    //4000143h - NOT USED - ZERO
    readIO[0x143] = this.memory.readZero;
    //4000144h through 400014Fh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x144, 0x14F);
    //4000150h - JoyBus Receive (R/W)
    readIO[0x150] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV0() | 0;
    }
    //4000151h - JoyBus Receive (R/W)
    readIO[0x151] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV1() | 0;
    }
    //4000152h - JoyBus Receive (R/W)
    readIO[0x152] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV2() | 0;
    }
    //4000153h - JoyBus Receive (R/W)
    readIO[0x153] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV3() | 0;
    }
    //4000154h - JoyBus Send (R/W)
    readIO[0x154] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND0() | 0;
    }
    //4000155h - JoyBus Send (R/W)
    readIO[0x155] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND1() | 0;
    }
    //4000156h - JoyBus Send (R/W)
    readIO[0x156] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND2() | 0;
    }
    //4000157h - JoyBus Send (R/W)
    readIO[0x157] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND3() | 0;
    }
    //4000158h - JoyBus Stat (R/W)
    readIO[0x158] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_STAT() | 0;
    }
    //4000159h - JoyBus Stat (R/W)
    readIO[0x159] = this.memory.readZero;
    //400015Ah - NOT USED - ZERO
    readIO[0x15A] = this.memory.readZero;
    //400015Bh - NOT USED - ZERO
    readIO[0x15B] = this.memory.readZero;
    //400015Ch through 40001FFh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x15C, 0x1FF);
    //4000200h - IE - Interrupt Enable Register (R/W)
    readIO[0x200] = function (parentObj) {
        return parentObj.irq.readIE0() | 0;
    }
    //4000201h - IE - Interrupt Enable Register (R/W)
    readIO[0x201] = function (parentObj) {
        return parentObj.irq.readIE1() | 0;
    }
    //4000202h - IF - Interrupt Request Flags / IRQ Acknowledge
    readIO[0x202] = function (parentObj) {
        parentObj.IOCore.updateCoreSpillRetain();
        return parentObj.irq.readIF0() | 0;
    }
    //4000203h - IF - Interrupt Request Flags / IRQ Acknowledge
    readIO[0x203] = function (parentObj) {
        parentObj.IOCore.updateCoreSpillRetain();
        return parentObj.irq.readIF1() | 0;
    }
    //4000204h - WAITCNT - Waitstate Control (R/W)
    readIO[0x204] = function (parentObj) {
        return parentObj.wait.readWAITCNT0() | 0;
    }
    //4000205h - WAITCNT - Waitstate Control (R/W)
    readIO[0x205] = function (parentObj) {
        return parentObj.wait.readWAITCNT1() | 0;
    }
    //4000206h - NOT USED - ZERO
    readIO[0x206] = this.memory.readZero;
    //4000207h - NOT USED - ZERO
    readIO[0x207] = this.memory.readZero;
    //4000208h - IME - Interrupt Master Enable Register (R/W)
    readIO[0x208] = function (parentObj) {
        return parentObj.irq.readIME() | 0;
    }
    //4000209h - IME - Interrupt Master Enable Register (R/W)
    readIO[0x209] = this.memory.readZero;
    //400020Ah - NOT USED - ZERO
    readIO[0x20A] = this.memory.readZero;
    //400020Bh - NOT USED - ZERO
    readIO[0x20B] = this.memory.readZero;
    //400020Ch through 40002FFh - NOT USED - GLITCHED
    this.fillReadTableUnused8(readIO, 0x20C, 0x2FF);
    //4000300h - POSTFLG - BYTE - Undocumented - Post Boot / Debug Control (R/W)
    readIO[0x300] = function (parentObj) {
        return parentObj.wait.readPOSTBOOT() | 0;
    }
    //4000301h - HALTCNT - BYTE - Undocumented - Low Power Mode Control (W)
    readIO[0x301] = this.memory.readZero;
    //4000302h - NOT USED - ZERO
    readIO[0x302] = this.memory.readZero;
    //4000303h - NOT USED - ZERO
    readIO[0x303] = this.memory.readZero;
    return readIO;
}
GameBoyAdvanceMemoryDispatchGenerator.prototype.generateMemoryReadIO16 = function () {
    var readIO = [];
    //4000000h - DISPCNT - LCD Control (Read/Write)
    readIO[0] = function (parentObj) {
        return parentObj.gfx.readDISPCNT0() | (parentObj.gfx.readDISPCNT1() << 8);
    }
    //4000002h - Undocumented - Green Swap (R/W)
    readIO[0x2 >> 1] = function (parentObj) {
        return parentObj.gfx.readGreenSwap() | 0;
    }
    //4000004h - DISPSTAT - General LCD Status (Read/Write)
    readIO[0x4 >> 1] = function (parentObj) {
        parentObj.IOCore.updateGraphicsClocking();
        return parentObj.gfx.readDISPSTAT0() | (parentObj.gfx.readDISPSTAT1() << 8);
    }
    //4000006h - VCOUNT - Vertical Counter (Read only)
    readIO[0x6 >> 1] = function (parentObj) {
        parentObj.IOCore.updateGraphicsClocking();
        return parentObj.gfx.readVCOUNT() | 0;
    }
    //4000008h - BG0CNT - BG0 Control (R/W) (BG Modes 0,1 only)
    readIO[0x8 >> 1] = function (parentObj) {
        return parentObj.gfx.readBG0CNT0() | (parentObj.gfx.readBG0CNT1() << 8);
    }
    //400000Ah - BG1CNT - BG1 Control (R/W) (BG Modes 0,1 only)
    readIO[0xA >> 1] = function (parentObj) {
        return parentObj.gfx.readBG1CNT0() | (parentObj.gfx.readBG1CNT1() << 8);
    }
    //400000Ch - BG2CNT - BG2 Control (R/W) (BG Modes 0,1,2 only)
    readIO[0xC >> 1] = function (parentObj) {
        return parentObj.gfx.readBG2CNT0() | (parentObj.gfx.readBG2CNT1() << 8);
    }
    //400000Eh - BG3CNT - BG3 Control (R/W) (BG Modes 0,2 only)
    readIO[0xE >> 1] = function (parentObj) {
        return parentObj.gfx.readBG3CNT0() | (parentObj.gfx.readBG3CNT1() << 8);
    }
    //4000010h through 4000047h - WRITE ONLY
    this.fillReadTableUnused16(readIO, 0x10 >> 1, 0x46 >> 1);
    //4000048h - WININ - Control of Inside of Window(s) (R/W)
    readIO[0x48 >> 1] = function (parentObj) {
        return parentObj.gfx.readWININ0() | (parentObj.gfx.readWININ1() << 8);
    }
    //400004Ah- WINOUT - Control of Outside of Windows & Inside of OBJ Window (R/W)
    readIO[0x4A >> 1] = function (parentObj) {
        return parentObj.gfx.readWINOUT0() | (parentObj.gfx.readWINOUT1() << 8);
    }
    //400004Ch - MOSAIC - Mosaic Size (W)
    readIO[0x4C >> 1] = this.memory.readUnused16IO1;
    //400004Eh - NOT USED - ZERO
    readIO[0x4E >> 1] = this.memory.readUnused16IO2;
    //4000050h - BLDCNT - Color Special Effects Selection (R/W)
    readIO[0x50 >> 1] = function (parentObj) {
        return parentObj.gfx.readBLDCNT0() | (parentObj.gfx.readBLDCNT1() << 8);
    }
    //4000052h - BLDALPHA - Alpha Blending Coefficients (R/W)
    readIO[0x52 >> 1] = function (parentObj) {
        return parentObj.gfx.readBLDALPHA0() | (parentObj.gfx.readBLDALPHA1() << 8);
    }
    //4000054h through 400005Fh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x54 >> 1, 0x5E >> 1);
    //4000060h - SOUND1CNT_L (NR10) - Channel 1 Sweep register (R/W)
    readIO[0x60 >> 1] = function (parentObj) {
        //NR10:
        return parentObj.sound.readSOUND1CNT_L() | 0;
    }
    //4000062h - SOUND1CNT_H (NR11, NR12) - Channel 1 Duty/Len/Envelope (R/W)
    readIO[0x62 >> 1] = function (parentObj) {
        //NR11:
        //NR12:
        return parentObj.sound.readSOUND1CNT_H0() | (parentObj.sound.readSOUND1CNT_H1() << 8);
    }
    //4000064h - SOUND1CNT_X (NR13, NR14) - Channel 1 Frequency/Control (R/W)
    readIO[0x64 >> 1] = function (parentObj) {
        //NR14:
        return parentObj.sound.readSOUND1CNT_X() << 8;
    }
    //4000066h - NOT USED - ZERO
    readIO[0x66 >> 1] = this.memory.readZero;
    //4000068h - SOUND2CNT_L (NR21, NR22) - Channel 2 Duty/Length/Envelope (R/W)
    readIO[0x68 >> 1] = function (parentObj) {
        //NR21:
        //NR22:
        return parentObj.sound.readSOUND2CNT_L0() | (parentObj.sound.readSOUND2CNT_L1() << 8);
    }
    //400006Ah - NOT USED - ZERO
    readIO[0x6A >> 1] = this.memory.readZero;
    //400006Ch - SOUND2CNT_H (NR23, NR24) - Channel 2 Frequency/Control (R/W)
    readIO[0x6C >> 1] = function (parentObj) {
        //NR24:
        return parentObj.sound.readSOUND2CNT_H() << 8;
    }
    //400006Eh - NOT USED - ZERO
    readIO[0x6E >> 1] = this.memory.readZero;
    //4000070h - SOUND3CNT_L (NR30) - Channel 3 Stop/Wave RAM select (R/W)
    readIO[0x70 >> 1] = function (parentObj) {
        //NR30:
        return parentObj.sound.readSOUND3CNT_L() | 0;
    }
    //4000073h - SOUND3CNT_H (NR31, NR32) - Channel 3 Length/Volume (R/W)
    readIO[0x72 >> 1] = function (parentObj) {
        //NR32:
        return parentObj.sound.readSOUND3CNT_H() << 8;
    }
    //4000074h - SOUND3CNT_X (NR33, NR34) - Channel 3 Frequency/Control (R/W)
    readIO[0x74 >> 1] = function (parentObj) {
        //NR34:
        return parentObj.sound.readSOUND3CNT_X() << 8;
    }
    //4000076h - NOT USED - ZERO
    readIO[0x76 >> 1] = this.memory.readZero;
    //4000078h - SOUND4CNT_L (NR41, NR42) - Channel 4 Length/Envelope (R/W)
    readIO[0x78 >> 1] = function (parentObj) {
        //NR42:
        return parentObj.sound.readSOUND4CNT_L() << 8;
    }
    //400007Ah - NOT USED - ZERO
    readIO[0x7A >> 1] = this.memory.readZero;
    //400007Ch - SOUND4CNT_H (NR43, NR44) - Channel 4 Frequency/Control (R/W)
    readIO[0x7C >> 1] = function (parentObj) {
        //NR43:
        //NR44:
        return parentObj.sound.readSOUND4CNT_H0() | (parentObj.sound.readSOUND4CNT_H1() << 8);
    }
    //400007Eh - NOT USED - ZERO
    readIO[0x7E >> 1] = this.memory.readZero;
    //4000080h - SOUNDCNT_L (NR50, NR51) - Channel L/R Volume/Enable (R/W)
    readIO[0x80 >> 1] = function (parentObj) {
        //NR50:
        //NR51:
        return parentObj.sound.readSOUNDCNT_L0() | (parentObj.sound.readSOUNDCNT_L1() << 8);
    }
    //4000082h - SOUNDCNT_H (GBA only) - DMA Sound Control/Mixing (R/W)
    readIO[0x82 >> 1] = function (parentObj) {
        return parentObj.sound.readSOUNDCNT_H0() | (parentObj.sound.readSOUNDCNT_H1() << 8);
    }
    //4000084h - SOUNDCNT_X (NR52) - Sound on/off (R/W)
    readIO[0x84 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readSOUNDCNT_X() | 0;
    }
    //4000086h - NOT USED - ZERO
    readIO[0x86 >> 1] = this.memory.readZero;
    //4000088h - SOUNDBIAS - Sound PWM Control (R/W, see below)
    readIO[0x88 >> 1] = function (parentObj) {
        return parentObj.sound.readSOUNDBIAS0() | (parentObj.sound.readSOUNDBIAS1() << 8);
    }
    //400008Ah - NOT USED - ZERO
    readIO[0x8A >> 1] = this.memory.readZero;
    //400008Ch - NOT USED - GLITCHED
    readIO[0x8C >> 1] = this.memory.readUnused16IO1;
    //400008Eh - NOT USED - GLITCHED
    readIO[0x8E >> 1] = this.memory.readUnused16IO2;
    //4000090h - WAVE_RAM0_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x90 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(0) | (parentObj.sound.readWAVE(1) << 8);
    }
    //4000092h - WAVE_RAM0_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x92 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(2) | (parentObj.sound.readWAVE(3) << 8);
    }
    //4000094h - WAVE_RAM1_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x94 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(4) | (parentObj.sound.readWAVE(5) << 8);
    }
    //4000096h - WAVE_RAM1_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x96 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(6) | (parentObj.sound.readWAVE(7) << 8);
    }
    //4000098h - WAVE_RAM2_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x98 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(8) | (parentObj.sound.readWAVE(9) << 8);
    }
    //400009Ah - WAVE_RAM2_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9A >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(10) | (parentObj.sound.readWAVE(11) << 8);
    }
    //400009Ch - WAVE_RAM3_L - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9C >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(12) | (parentObj.sound.readWAVE(13) << 8);
    }
    //400009Eh - WAVE_RAM3_H - Channel 3 Wave Pattern RAM (W/R)
    readIO[0x9E >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.sound.readWAVE(14) | (parentObj.sound.readWAVE(15) << 8);
    }
    //40000A0h through 40000B9h - WRITE ONLY
    this.fillReadTableUnused16(readIO, 0xA0 >> 1, 0xB8 >> 1);
    //40000BAh - DMA0CNT_H - DMA 0 Control (R/W)
    readIO[0xBA >> 1] = function (parentObj) {
        return parentObj.dma.readDMAControl0(0) | (parentObj.dma.readDMAControl1(0) << 8);
    }
    //40000BCh through 40000C5h - WRITE ONLY
    this.fillReadTableUnused16(readIO, 0xBC >> 1, 0xC4 >> 1);
    //40000C6h - DMA1CNT_H - DMA 1 Control (R/W)
    readIO[0xC6 >> 1] = function (parentObj) {
        return parentObj.dma.readDMAControl0(1) | (parentObj.dma.readDMAControl1(1) << 8);
    }
    //40000C8h through 40000D1h - WRITE ONLY
    this.fillReadTableUnused16(readIO, 0xC8 >> 1, 0xD0 >> 1);
    //40000D2h - DMA2CNT_H - DMA 2 Control (R/W)
    readIO[0xD2 >> 1] = function (parentObj) {
        return parentObj.dma.readDMAControl0(2) | (parentObj.dma.readDMAControl1(2) << 8);
    }
    //40000D4h through 40000DDh - WRITE ONLY
    this.fillReadTableUnused16(readIO, 0xD4 >> 1, 0xDC >> 1);
    //40000DEh - DMA3CNT_H - DMA 3 Control (R/W)
    readIO[0xDE >> 1] = function (parentObj) {
        return parentObj.dma.readDMAControl0(3) | (parentObj.dma.readDMAControl1(3) << 8);
    }
    //40000E0h through 40000FFh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0xE0 >> 1, 0xFE >> 1);
    //4000100h - TM0CNT_L - Timer 0 Counter/Reload (R/W)
    readIO[0x100 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM0CNT_L0() | (parentObj.timer.readTM0CNT_L1() << 8);
    }
    //4000102h - TM0CNT_H - Timer 0 Control (R/W)
    readIO[0x102 >> 1] = function (parentObj) {
        return parentObj.timer.readTM0CNT_H() | 0;
    }
    //4000104h - TM1CNT_L - Timer 1 Counter/Reload (R/W)
    readIO[0x104 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM1CNT_L0() | (parentObj.timer.readTM1CNT_L1() << 8);
    }
    //4000106h - TM1CNT_H - Timer 1 Control (R/W)
    readIO[0x106 >> 1] = function (parentObj) {
        return parentObj.timer.readTM1CNT_H() | 0;
    }
    //4000108h - TM2CNT_L - Timer 2 Counter/Reload (R/W)
    readIO[0x108 >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM2CNT_L0() | (parentObj.timer.readTM2CNT_L1() << 8);
    }
    //400010Ah - TM2CNT_H - Timer 2 Control (R/W)
    readIO[0x10A >> 1] = function (parentObj) {
        return parentObj.timer.readTM2CNT_H() | 0;
    }
    //400010Ch - TM3CNT_L - Timer 3 Counter/Reload (R/W)
    readIO[0x10C >> 1] = function (parentObj) {
        parentObj.IOCore.updateTimerClocking();
        return parentObj.timer.readTM3CNT_L0() | (parentObj.timer.readTM3CNT_L1() << 8);
    }
    //400010Eh - TM3CNT_H - Timer 3 Control (R/W)
    readIO[0x10E >> 1] = function (parentObj) {
        return parentObj.timer.readTM3CNT_H() | 0;
    }
    //4000110h through 400011Fh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x110 >> 1, 0x11E >> 1);
    //4000120h - Serial Data A (R/W)
    readIO[0x120 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_A0() | (parentObj.serial.readSIODATA_A1() << 8);
    }
    //4000122h - Serial Data B (R/W)
    readIO[0x122 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_B0() | (parentObj.serial.readSIODATA_B1() << 8);
    }
    //4000124h - Serial Data C (R/W)
    readIO[0x124 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_C0() | (parentObj.serial.readSIODATA_C1() << 8);
    }
    //4000126h - Serial Data D (R/W)
    readIO[0x126 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA_D0() | (parentObj.serial.readSIODATA_D1() << 8);
    }
    //4000128h - SIOCNT - SIO Sub Mode Control (R/W)
    readIO[0x128 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIOCNT0() | (parentObj.serial.readSIOCNT1() << 8);
    }
    //400012Ah - SIOMLT_SEND - Data Send Register (R/W)
    readIO[0x12A >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readSIODATA8_0() | (parentObj.serial.readSIODATA8_1() << 8);
    }
    //400012Ch through 400012Fh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x12C >> 1, 0x12E >> 1);
    //4000130h - KEYINPUT - Key Status (R)
    readIO[0x130 >> 1] = function (parentObj) {
        return parentObj.joypad.readKeyStatus0() | (parentObj.joypad.readKeyStatus1() << 8);
    }
    //4000132h - KEYCNT - Key Interrupt Control (R/W)
    readIO[0x132 >> 1] = function (parentObj) {
        return parentObj.joypad.readKeyControl0() | (parentObj.joypad.readKeyControl1() << 8);
    }
    //4000134h - RCNT (R/W) - Mode Selection
    readIO[0x134 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readRCNT0() | (parentObj.serial.readRCNT1() << 8);
    }
    //4000136h - NOT USED - ZERO
    readIO[0x136 >> 1] = this.memory.readZero;
    //4000138h through 400013Fh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x138 >> 1, 0x13E >> 1);
    //4000140h - JOYCNT - JOY BUS Control Register (R/W)
    readIO[0x140 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYCNT() | 0;
    }
    //4000142h - NOT USED - ZERO
    readIO[0x142 >> 1] = this.memory.readZero;
    //4000144h through 400014Fh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x144 >> 1, 0x14E >> 1);
    //4000150h - JoyBus Receive (R/W)
    readIO[0x150 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV0() | (parentObj.serial.readJOYBUS_RECV1() << 8);
    }
    //4000152h - JoyBus Receive (R/W)
    readIO[0x152 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_RECV2() | (parentObj.serial.readJOYBUS_RECV3() << 8);
    }
    //4000154h - JoyBus Send (R/W)
    readIO[0x154 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND0() | (parentObj.serial.readJOYBUS_SEND1() << 8);
    }
    //4000156h - JoyBus Send (R/W)
    readIO[0x156 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_SEND2() | (parentObj.serial.readJOYBUS_SEND3() << 8);
    }
    //4000158h - JoyBus Stat (R/W)
    readIO[0x158 >> 1] = function (parentObj) {
        parentObj.IOCore.updateSerialClocking();
        return parentObj.serial.readJOYBUS_STAT() | 0;
    }
    //400015Ah - NOT USED - ZERO
    readIO[0x15A >> 1] = this.memory.readZero;
    //400015Ch through 40001FFh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x15C >> 1, 0x1FE >> 1);
    //4000200h - IE - Interrupt Enable Register (R/W)
    readIO[0x200 >> 1] = function (parentObj) {
        return parentObj.irq.readIE0() | (parentObj.irq.readIE1() << 8);
    }
    //4000202h - IF - Interrupt Request Flags / IRQ Acknowledge
    readIO[0x202 >> 1] = function (parentObj) {
        parentObj.IOCore.updateCoreSpillRetain();
        return parentObj.irq.readIF0() | (parentObj.irq.readIF1() << 8);
    }
    //4000204h - WAITCNT - Waitstate Control (R/W)
    readIO[0x204 >> 1] = function (parentObj) {
        return parentObj.wait.readWAITCNT0() | (parentObj.wait.readWAITCNT1() << 8);
    }
    //4000206h - NOT USED - ZERO
    readIO[0x206 >> 1] = this.memory.readZero;
    //4000208h - IME - Interrupt Master Enable Register (R/W)
    readIO[0x208 >> 1] = function (parentObj) {
        return parentObj.irq.readIME() | 0;
    }
    //400020Ah - NOT USED - ZERO
    readIO[0x20A >> 1] = this.memory.readZero;
    //400020Ch through 40002FFh - NOT USED - GLITCHED
    this.fillReadTableUnused16(readIO, 0x20C >> 1, 0x2FE >> 1);
    //4000300h - POSTFLG - BYTE - Undocumented - Post Boot / Debug Control (R/W)
    readIO[0x300 >> 1] = function (parentObj) {
        return parentObj.wait.readPOSTBOOT() | 0;
    }
    //4000302h - NOT USED - ZERO
    readIO[0x302 >> 1] = this.memory.readZero;
    return readIO;
}
GameBoyAdvanceMemoryDispatchGenerator.prototype.fillReadTableUnused8 = function (readIO, from, to) {
    //Fill in slots of the i/o read table:
    while (from <= to) {
        readIO[from++] = this.memory.readUnused0;
        readIO[from++] = this.memory.readUnused1;
        readIO[from++] = this.memory.readUnused2;
        readIO[from++] = this.memory.readUnused3;
    }
}
GameBoyAdvanceMemoryDispatchGenerator.prototype.fillReadTableUnused16 = function (readIO, from, to) {
    //Fill in slots of the i/o read table:
    while (from <= to) {
        if ((from & 0x1) == 0) {
            readIO[from++] = this.memory.readUnused16IO1;
        }
        else {
            readIO[from++] = this.memory.readUnused16IO2;
        }
    }
}