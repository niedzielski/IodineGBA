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
function GameBoyAdvanceARMInstructionMemoryCache(memory) {
    //Build references:
    this.memory = memory;
    this.addressRead32 = 0x100;
    this.cacheRead32 = this.memory.readUnused32;
    //Make the memory core aware of us so it can invalidate us:
    this.memory.addMemoryCacheRoot(this);
}
GameBoyAdvanceARMInstructionMemoryCache.prototype.memoryReadFast32 = function (address) {
    address = address >>> 0;
    if ((address >>> 24) != (this.addressRead32 >>> 0)) {
        this.addressRead32 = address >>> 24;
        this.cacheRead32 = this.memory.memoryReader32CPU[address >>> 24];
        //In case we switched into reading from ROM, make sure we start with an empty prebuffer:
        this.memory.wait.resetPrebuffer();
    }
    return this.cacheRead32(this.memory, address >>> 0) | 0;
}
GameBoyAdvanceARMInstructionMemoryCache.prototype.invalidateIfWRAM = function () {
    if (this.addressRead32 == 0x2 || this.addressRead32 == 0x3) {
        //Invalidate the check address:
        this.addressRead32 = 0x100;
    }
}