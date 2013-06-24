"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2013 Grant Galitz
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
function DynarecBranchListenerCore(CPUCore) {
	this.CPUCore = CPUCore;
    this.initialize();
}
DynarecBranchListenerCore.prototype.initialize = function () {
    this.lastBranch = 0;
    this.caches = {};
    this.currentCache = null;
    this.compiling = false;
}
DynarecBranchListenerCore.prototype.enter = function (oldPC, newPC, instructionmode, cpumode) {
    this.analyzePast(oldPC >>> 0, instructionmode, cpumode);
    this.handleNext(newPC >>> 0, instructionmode, cpumode);
}
DynarecBranchListenerCore.prototype.analyzePast = function (endPC, instructionmode, cpumode) {
    if (this.isAddressSafe(this.lastBranch)) {
        var cache = this.findCache(this.lastBranch);
        if (!cache) {
            cache = new DynarecCacheManagerCore(this.CPUCore, this.lastBranch, endPC, instructionmode, cpumode);
            this.cacheAppend(cache);
        }
        cache.tickHotness();
    }
}
DynarecBranchListenerCore.prototype.handleNext = function (newPC, instructionmode, cpumode) {
    this.lastBranch = newPC;
    if (this.routineCacheable(newPC, instructionmode, cpumode)) {
        var cache = this.findCache(newPC);
        if (cache) {
            if (cache.ready()) {
                this.CPUCore.IOCore.systemStatus = 5;
                this.currentCache = cache;
            }
        }
    }
}
DynarecBranchListenerCore.prototype.enter = function () {
    //Execute our compiled code:
    this.currentCache.execute();
    //Return to normal state machine loop operations:
    this.CPUCore.emulatorCore.systemStatus -= 5;
}
DynarecBranchListenerCore.prototype.isAddressSafe = function (address) {
    if (address < 0xE000000) {
        if (address < 0x4000000) {
            if (address >= 0x2000000) {
                return true;
            }
            else if (address >= 0x8000000) {
                return true;
            }
            else if (address < 0x40000 && this.CPUCore.IOCore.BIOSFound) {
                return true;
            }
        }
    }
    return false;
}
DynarecBranchListenerCore.prototype.cacheAppend = function (cache) {
    this.caches["c_" + (cache.start >>> 0)] = cache;
}
DynarecBranchListenerCore.prototype.findCache = function (address) {
    this.caches["c_" + (address >>> 0)];
}