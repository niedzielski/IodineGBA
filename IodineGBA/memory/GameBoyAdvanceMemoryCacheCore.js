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
function GameBoyAdvanceMemoryCache(memory) {
	//Build references:
	this.memory = memory;
    this.addressRead16 = 0xFF;
	this.addressRead32 = 0xFF;
    this.addressWrite16 = 0xFF;
    this.addressWrite32 = 0xFF;
    this.cacheRead16 = this.memory.readUnused16;
    this.cacheRead32 = this.memory.readUnused32;
    this.cacheWrite16 = this.memory.writeUnused16;
    this.cacheWrite32 = this.memory.writeUnused32;
}
GameBoyAdvanceMemoryCache.prototype.memoryReadFast16 = function (address) {
    address = address >>> 0;
    if ((address >>> 24) != (this.addressRead16 >>> 0)) {
        this.addressRead16 = address >>> 24;
        this.cacheRead16 = this.memory.memoryReader16[address >>> 24];
    }
    return this.cacheRead16(this.memory, address >>> 0) | 0;
}
GameBoyAdvanceMemoryCache.prototype.memoryReadFast32 = function (address) {
    address = address >>> 0;
    if ((address >>> 24) != (this.addressRead32 >>> 0)) {
        this.addressRead32 = address >>> 24;
        this.cacheRead32 = this.memory.memoryReader32[address >>> 24];
    }
    return this.cacheRead32(this.memory, address >>> 0) | 0;
}
GameBoyAdvanceMemoryCache.prototype.memoryWriteFast16 = function (address, data) {
    address = address >>> 0;
    data = data | 0;
    if ((address >>> 24) != (this.addressWrite16 >>> 0)) {
        this.addressWrite16 = address >>> 24;
        this.cacheWrite16 = this.memory.memoryWriter16[address >>> 24];
    }
    this.cacheWrite16(this.memory, address >>> 0, data | 0);
}
GameBoyAdvanceMemoryCache.prototype.memoryWriteFast32 = function (address, data) {
    address = address >>> 0;
    data = data | 0;
    if ((address >>> 24) != (this.addressWrite32 >>> 0)) {
        this.addressWrite32 = address >>> 24;
        this.cacheWrite32 = this.memory.memoryWriter32[address >>> 24];
    }
    this.cacheWrite32(this.memory, address >>> 0, data | 0);
}
GameBoyAdvanceMemoryCache.prototype.memoryRead16 = function (address) {
	address = address >>> 0;
    //Half-Word Read:
    if ((address & 0x1) == 0) {
        //Use optimized path for aligned:
        return this.memoryReadFast16(address >>> 0) | 0;
    }
    else {
        return this.memory.memoryRead16Unaligned(address >>> 0) | 0;
    }
}
GameBoyAdvanceMemoryCache.prototype.memoryRead32 = function (address) {
	address = address >>> 0;
    //Word Read:
    if ((address & 0x3) == 0) {
        //Use optimized path for aligned:
        return this.memoryReadFast32(address >>> 0) | 0;
    }
    else {
        return this.memory.memoryRead32Unaligned(address >>> 0) | 0;
    }
}
GameBoyAdvanceMemoryCache.prototype.memoryWrite16 = function (address, data) {
	address = address >>> 0;
    data = data | 0;
    //Half-Word Write:
	if ((address & 0x1) == 0) {
        //Use optimized path for aligned:
        this.memoryWriteFast16(address >>> 0, data | 0);
    }
    else {
        this.memory.memoryWrite16Unaligned(address >>> 0, data | 0);
    }
}
GameBoyAdvanceMemoryCache.prototype.memoryWrite32 = function (address, data) {
	address = address >>> 0;
    data = data | 0;
    //Word Write:
	if ((address & 0x3) == 0) {
        //Use optimized path for aligned:
        this.memoryWriteFast32(address >>> 0, data | 0);
    }
    else {
        this.memory.memoryWrite32Unaligned(address >>> 0, data | 0);
    }
}