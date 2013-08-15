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
    this.lastTHUMB = false;
    this.lastCPUMode = 0x10;
    this.caches = {};
    this.readyCaches = {};
    this.currentCache = null;
    this.compiling = 0;
    this.backEdge = false;
}
DynarecBranchListenerCore.prototype.listen = function (oldPC, newPC, instructionmode, cpumode) {
    if ((this.CPUCore.emulatorCore.dynarecTHUMB && instructionmode) || (this.CPUCore.emulatorCore.dynarecARM && !instructionmode)) {
        this.analyzePast(oldPC >>> 0, instructionmode, cpumode);
        this.handleNext(newPC >>> 0, instructionmode, cpumode);
    }
    else {
        this.backEdge = false;
    }
}
DynarecBranchListenerCore.prototype.analyzePast = function (endPC, instructionmode, cpumode) {
    if (this.backEdge && cpumode == this.lastCPUMode) {
        var cache = this.findCache(this.lastBranch);
        if (!cache) {
            cache = new DynarecCacheManagerCore(this.CPUCore, this.lastBranch >>> 0, endPC >>> 0, this.lastTHUMB, this.lastCPUMode);
            this.cacheAppend(cache);
        }
        cache.tickHotness();
    }
    this.backEdge = true;
}
DynarecBranchListenerCore.prototype.handleNext = function (newPC, instructionmode, cpumode) {
    this.lastBranch = newPC;
    this.lastTHUMB = instructionmode;
    this.lastCPUMode = cpumode;
    if (this.isAddressSafe(newPC)) {
        var cache = this.findCacheReady(newPC);
        if (cache) {
            this.CPUCore.IOCore.preprocessCPUHandler(1);
            this.currentCache = cache;
        }
    }
    else {
        this.backEdge = false;
    }
}
DynarecBranchListenerCore.prototype.enter = function () {
   if (this.CPUCore.emulatorCore.dynarecEnabled) {
       //Execute our compiled code:
       this.currentCache(this.CPUCore);
   }
}
DynarecBranchListenerCore.prototype.isAddressSafe = function (address) {
    if (address < 0xE000000) {
        if (address < 0x4000000) {
            if (address >= 0x2000000) {
                return true;
            }
            else if (this.CPUCore.IOCore.BIOSFound && address >= 0x20 && address < 0x4000) {
                return true;
            }
        }
        else if (address >= 0x8000000) {
            return true;
        }
    }
    return false;
}
DynarecBranchListenerCore.prototype.cacheAppend = function (cache) {
    this.caches["c_" + (cache.start >>> 0)] = cache;
}
DynarecBranchListenerCore.prototype.cacheAppendReady = function (address, cache) {
    this.readyCaches["c_" + (address >>> 0)] = cache;
}
DynarecBranchListenerCore.prototype.findCache = function (address) {
    return this.caches["c_" + (address >>> 0)];
}
DynarecBranchListenerCore.prototype.findCacheReady = function (address) {
    return this.readyCaches["c_" + (address >>> 0)];
}
DynarecBranchListenerCore.prototype.invalidateCaches = function () {
    this.readyCaches = {};
}