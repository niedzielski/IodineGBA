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
function GameBoyAdvanceTHUMBInstructionMemoryCache(memory) {
    //Build references:
    this.memory = memory;
    this.addressRead16 = 0x100;
    this.cacheRead16 = this.memory.readUnused16;
    //Make the memory core aware of us so it can invalidate us:
    this.memory.addMemoryCacheRoot(this);
}
GameBoyAdvanceTHUMBInstructionMemoryCache.prototype.memoryReadFast16 = function (address) {
    address = address >>> 0;
    if ((address >>> 24) != (this.addressRead16 >>> 0)) {
        this.addressRead16 = address >>> 24;
        this.cacheRead16 = this.memory.memoryReader16CPU[address >>> 24];
        //In case we switched into reading from ROM, make sure we start with an empty prebuffer:
        this.memory.wait.resetPrebuffer();
    }
    return this.cacheRead16(this.memory, address >>> 0) | 0;
}
GameBoyAdvanceTHUMBInstructionMemoryCache.prototype.invalidateIfWRAM = function () {
    if (this.addressRead16 == 0x2 || this.addressRead16 == 0x3) {
        //Invalidate the check address:
        this.addressRead16 = 0x100;
    }
}