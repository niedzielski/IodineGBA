"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2015 Grant Galitz
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
function GameBoyAdvanceGamePakWait(IOCore) {
    this.IOCore = IOCore;
    this.memory = this.IOCore.memory;
}
GameBoyAdvanceGamePakWait.prototype.initialize = function () {
    this.nonSequential = 0x100;             //Non-sequential access bit-flag.
    this.buffered = 0;                      //Tracking of the size of the prebuffer cache.
    this.clocks = 0;                        //Tracking clocks for prebuffer cache.
    //Create the wait state address translation cache:
    this.waitStateClocks16 = getUint8Array(0x200);
    this.waitStateClocks32 = getUint8Array(0x200);
    //Wait State 0:
    this.setWaitState(0, 0);
    //Wait State 1:
    this.setWaitState(1, 0);
    //Wait State 2:
    this.setWaitState(2, 0);
    //Initialize out some dynamic references:
    this.getROMRead16 = this.getROMRead16NoPrefetch;
    this.getROMRead32 = this.getROMRead32NoPrefetch;
    this.CPUInternalCyclePrefetch = this.CPUInternalCycleNoPrefetch;
    this.CPUInternalSingleCyclePrefetch = this.CPUInternalSingleCycleNoPrefetch;
}
GameBoyAdvanceGamePakWait.prototype.getWaitStateFirstAccess = function (data) {
    //Get the first access timing:
    data = data | 0;
    data = data & 0x3;
    if ((data | 0) < 0x3) {
        data = (5 - (data | 0)) | 0;
    }
    else {
        data = 9;
    }
    return data | 0;
}
GameBoyAdvanceGamePakWait.prototype.getWaitStateSecondAccess = function (region, data) {
    //Get the second access timing:
    region = region | 0;
    data = data | 0;
    if ((data & 0x4) == 0) {
        data = 0x2 << (region | 0);
        data = ((data | 0) + 1) | 0;
    }
    else {
        data = 0x2;
    }
    return data | 0;
}
GameBoyAdvanceGamePakWait.prototype.setWaitState = function (region, data) {
    region = region | 0;
    data = data | 0;
    //Wait State First Access:
    var firstAccess = this.getWaitStateFirstAccess(data & 0x3) | 0;
    //Wait State Second Access:
    var secondAccess = this.getWaitStateSecondAccess(region | 0, data | 0) | 0;
    region = region << 1;
    //Computing First Access:
    //8-16 bit access:
    this.waitStateClocks16[0x108 | region] = firstAccess | 0;
    this.waitStateClocks16[0x109 | region] = firstAccess | 0;
    //32 bit access:
    var accessTime = ((firstAccess | 0) + (secondAccess | 0)) | 0;
    this.waitStateClocks32[0x108 | region] = accessTime | 0;
    this.waitStateClocks32[0x109 | region] = accessTime | 0;
    //Computing Second Access:
    //8-16 bit access:
    this.waitStateClocks16[0x8 | region] = secondAccess | 0;
    this.waitStateClocks16[0x9 | region] = secondAccess | 0;
    //32 bit access:
    this.waitStateClocks32[0x8 | region] = secondAccess << 1;
    this.waitStateClocks32[0x9 | region] = secondAccess << 1;
}
GameBoyAdvanceGamePakWait.prototype.writeWAITCNT0 = function (data) {
    data = data | 0;
    //Set Wait State 0:
    this.setWaitState(0, data >> 2);
    //Set Wait State 1:
    this.setWaitState(1, data >> 5);
}
GameBoyAdvanceGamePakWait.prototype.writeWAITCNT1 = function (data) {
    data = data | 0;
    //Set Wait State 2:
    this.setWaitState(2, data | 0);
    //Set Prefetch Mode:
    if ((data & 0x40) == 0) {
        //No Prefetch:
        this.getROMRead16 = this.getROMRead16NoPrefetch;
        this.getROMRead32 = this.getROMRead32NoPrefetch;
        this.CPUInternalCyclePrefetch = this.CPUInternalCycleNoPrefetch;
        this.CPUInternalSingleCyclePrefetch = this.CPUInternalSingleCycleNoPrefetch;
    }
    else {
        //Prefetch Enabled:
        this.getROMRead16 = this.getROMRead16Prefetch;
        this.getROMRead32 = this.getROMRead32Prefetch;
        this.CPUInternalCyclePrefetch = this.addMultipleClocks;
        this.CPUInternalSingleCyclePrefetch = this.addSingleClock;
    }
}