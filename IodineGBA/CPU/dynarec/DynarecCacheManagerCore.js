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
function DynarecCacheManagerCore(cpu, start, end, InTHUMB, CPUMode) {
	this.CPUCore = cpu;
    this.start = start | 0;
    this.end = end | 0;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.badCount = 0;
    this.hotCount = 0;
    this.record = [];
    this.cache = null;
    this.worker = null;
}
DynarecCacheManagerCore.prototype.MAGIC_HOT_COUNT = 10;
DynarecCacheManagerCore.prototype.MAGIC_BAD_COUNT = 10;
DynarecCacheManagerCore.prototype.ready = function () {
    return !!this.cache;
}
DynarecCacheManagerCore.prototype.execute = function () {
    //Execute stub:
    this.cache(this);
}
DynarecCacheManagerCore.prototype.tickHotness = function () {
    if (this.start >= this.end) {
        //Don't let sub-routines too small through:
        return;
    }
    if (!this.cache) {
        if (this.badCount <= this.MAGIC_BAD_COUNT) {
            ++this.hotCount;
            if (this.hotCount >= this.MAGIC_HOT_COUNT) {
                this.compile();
            }
        }
    }
}
DynarecCacheManagerCore.prototype.bailout = function () {
    this.cache = null;
    ++this.badCount;
}
DynarecCacheManagerCore.prototype.read = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return this.CPUCore.IOCore.cartridge.readROM32(address & 0x1FFFFFF);
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return this.CPUCore.IOCore.memory.externalRAM[address & 0x3FFFF] | (this.CPUCore.IOCore.memory.externalRAM[(address & 0x3FFFF) | 1] << 8) | (this.CPUCore.IOCore.memory.externalRAM[(address & 0x3FFFF) | 2] << 16)  | (this.CPUCore.IOCore.memory.externalRAM[(address & 0x3FFFF) | 3] << 24);
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return this.CPUCore.IOCore.memory.internalRAM[address & 0x7FFF] | (this.CPUCore.IOCore.memory.internalRAM[(address & 0x7FFF) | 1] << 8) | (this.CPUCore.IOCore.memory.internalRAM[(address & 0x7FFF) | 2] << 16)  | (this.CPUCore.IOCore.memory.internalRAM[(address & 0x7FFF) | 3] << 24);
    }
    else if (address >= 0x20 && address < 0x4000) {
        return this.CPUCore.IOCore.memory.BIOS[address] | (this.CPUCore.IOCore.memory.BIOS[address | 1] << 8) | (this.CPUCore.IOCore.memory.BIOS[address | 2] << 16)  | (this.CPUCore.IOCore.memory.BIOS[address | 3] << 24);
    }
}
DynarecCacheManagerCore.prototype.compile = function () {
    //Make sure there isn't another worker compiling:
    if (!this.CPUCore.dynarec.compiling) {
        this.record = [];
        var start = this.start;
        while (start < this.end) {
            //Build up a record of bytecode to pass to the worker to compile:
            this.record.push(this.read(start));
        }
        try {
            var parentObj = this;
            this.worker = new Worker("IodineGBA/CPU/dynarec/DynarecCompilerWorkerCore.js");
            this.worker.onmessage = function (message) {
                var code = message[0];
                switch (code) {
                        //Got the code block back:
                    case 0:
                        parentObj.cache = new Function(message[1]);
                        parentObj.CPUCore.dynarec.compiling = false;
                        break;
                        //Compiler returned an error:
                    case 1:
                        parentObj.bailout();
                }
                //Destroy the worker:
                parentObj.worker = null;
            }
            //Put a lock on the compiler:
            this.CPUCore.dynarec.compiling = true;
            //Pass the record memory and state:
            this.worker.postMessage([this.record, this.InTHUMB, this.CPUMode, (start >= 0x8000000 || start < 0x4000)]);
        }
        catch (error) {
            //Browser doesn't support webworkers, so disable dynarec:
            this.CPUCore.emulatorCore.dynarecEnabled = false;
        }
    }
}