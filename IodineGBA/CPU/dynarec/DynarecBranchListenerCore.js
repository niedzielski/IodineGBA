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
    this.caches = {};
    this.readyCaches = {};
    this.currentCache = null;
    this.compiling = 0;
    this.backEdge = false;
}
DynarecBranchListenerCore.prototype.listen = function (oldPC, newPC, instructionmode) {
    if ((this.CPUCore.emulatorCore.dynarecTHUMB && instructionmode) || (this.CPUCore.emulatorCore.dynarecARM && !instructionmode)) {
        this.analyzePast(oldPC >>> 0, instructionmode);
        this.handleNext(newPC >>> 0, instructionmode);
    }
    else {
        this.backEdge = false;
    }
}
DynarecBranchListenerCore.prototype.analyzePast = function (endPC, instructionmode) {
    endPC = endPC >>> 0;
    instructionmode = !!instructionmode;
    if (this.backEdge) {
        var cache = this.findCache(this.lastBranch >>> 0);
        if (!cache) {
            cache = new DynarecCacheManagerCore(this.CPUCore, this.lastBranch >>> 0, endPC >>> 0, !!this.lastTHUMB);
            this.cacheAppend(cache);
        }
        cache.tickHotness();
    }
    this.backEdge = true;
}
DynarecBranchListenerCore.prototype.handleNext = function (newPC, instructionmode) {
    this.lastBranch = newPC >>> 0;
    this.lastTHUMB = !!instructionmode;
    if (this.isAddressSafe(newPC >>> 0)) {
        var cache = this.findCacheReady(newPC >>> 0, !!instructionmode);
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
    address = address >>> 0;
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
DynarecBranchListenerCore.prototype.cacheAppendReady = function (address, InTHUMB, cache) {
    address = address >>> 0;
    InTHUMB = !!InTHUMB;
    this.readyCaches[((InTHUMB) ? "thumb_" : "arm_") + (address >>> 0)] = cache;
}
DynarecBranchListenerCore.prototype.findCache = function (address) {
    address = address >>> 0;
    return this.caches["c_" + (address >>> 0)];
}
DynarecBranchListenerCore.prototype.findCacheReady = function (address, InTHUMB) {
    address = address >>> 0;
    InTHUMB = !!InTHUMB;
    return this.readyCaches[((InTHUMB) ? "thumb_" : "arm_") + (address >>> 0)];
}
DynarecBranchListenerCore.prototype.deleteReadyCaches = function (address) {
    address = address >>> 0;
    this.readyCaches["thumb_"+ (address >>> 0)] = null;
    this.readyCaches["arm_"+ (address >>> 0)] = null;
}
DynarecBranchListenerCore.prototype.invalidateCaches = function () {
    this.readyCaches = {};
}