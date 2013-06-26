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
importScripts(/*"DynarecARMAssemblerCore.js", "DynarecTHUMBAssemblerCore.js"*/);
self.onmessage = function (command) {
    var info = command.data;
    var startPC = info[0];
    var record = info[1];
    var InTHUMB = info[2];
    var CPUMode = info[3];
    var isROM = info[4];
    try {
        var compiler = new DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM);
    }
    catch (error) {
        //Compiler had an internal error, tell the manager about it:
        bailout();
    }
}
function bailout() {
    postMessage([1]);
    self.close();
}
function done(functionString) {
    postMessage([0, functionString]);
    self.close();
}
function DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM) {
    this.instructionsToJoin = [];
    this.pc = startPC | 0;
    this.record = record;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.isROM = isROM;
    //this.thumbAssembler = new DynarecTHUMBAssemblerCore(this);
    //this.armAssembler = new DynarecARMAssemblerCore(this);
    this.compile();
    this.finish();
}
DynarecCompilerWorkerCore.prototype.compile = function () {
    var length = this.record.length;
    for (var index = 0; index < length; ++index) {
        this.instructionsToJoin.push(this.parseInstruction(this.record[index]));
        this.incrementPC();
    }
}
DynarecCompilerWorkerCore.prototype.parseInstruction = function (instructionValue) {
    var instuctionCode = this.decodeInstruction(instructionValue);
    this.incrementPC();
    return this.addRAMGuards(instructionValue, instuctionCode);
}
DynarecCompilerWorkerCore.prototype.incrementPC = function () {
    if (this.InTHUMB) {
        this.pc = (this.pc + 2) | 0;
    }
    else {
        this.pc = (this.pc + 4) | 0;
    }
}
DynarecCacheManagerCore.prototype.read16 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM16(" + (address & 0x1FFFFFF) + ");";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[" + (address & 0x3FFFF) + "] | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 1) + "] << 8);";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[" + (address & 0x7FFF) + "] | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 1) + "] << 8);";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[" + (address) + "] | (this.CPUCore.IOCore.memory.BIOS[" + (address | 1) + "] << 8);";
    }
    else {
        bailout();
    }
}
DynarecCacheManagerCore.prototype.read32 = function (address) {
    if (address >= 0x8000000 && address < 0xE000000) {
        return "this.CPUCore.IOCore.cartridge.readROM32(" + (address & 0x1FFFFFF) + ");";
    }
    else if (address >= 0x3000000 && address < 0x4000000) {
        return "this.CPUCore.IOCore.memory.externalRAM[" + (address & 0x3FFFF) + "] | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 1) + "] << 8) | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.externalRAM[" + ((address & 0x3FFFF) | 3) + "] << 24);";
    }
    else if (address >= 0x2000000 && address < 0x3000000) {
        return "this.CPUCore.IOCore.memory.internalRAM[" + (address & 0x7FFF) + "] | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 1) + "] << 8) | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.internalRAM[" + ((address & 0x7FFF) | 3) + "] << 24);";
    }
    else if (address >= 0x20 && address < 0x4000) {
        return "this.CPUCore.IOCore.memory.BIOS[" + (address) + "] | (this.CPUCore.IOCore.memory.BIOS[" + (address | 1) + "] << 8) | (this.CPUCore.IOCore.memory.BIOS[" + (address | 2) + "] << 16)  | (this.CPUCore.IOCore.memory.BIOS[" + (address | 3) + "] << 24);";
    }
    else {
        bailout();
    }
}
DynarecCompilerWorkerCore.prototype.addMemoryRead = function () {
    if (this.InTHUMB) {
        return this.read16(this.pc);
    }
    else {
        return this.read32(this.pc);
    }
}
DynarecCompilerWorkerCore.prototype.bailoutEarly = function () {
    var bailoutText = "cpu.registers[15] = " + this.pc + ";";
    bailoutText += this.addStateMachineUpdate();
    bailoutText += "return;";
    return bailoutText;
}
DynarecCompilerWorkerCore.prototype.addRAMGuards = function (instructionValue, instructionCode) {
    if (this.isROM) {
        return instructionCode;
    }
    var guardText = "var instruction = " +  this.addMemoryRead() + ";";
    guardText += "if (instruction != " + instructionValue + ") {";
    guardText += this.bailoutEarly();
    guardText += "}";
    guardText += instructionCode;
}
DynarecCompilerWorkerCore.prototype.addClockChecks = function () {
    return "if (cpu.IOCore.cyclesUntilNextEvent() < " + this.compiler.clocks + ") { return; }";
}
DynarecCompilerWorkerCore.prototype.addStateMachineUpdate = function () {
    return "cpu.IOCore.updateCore(" + this.compiler.clocks + ");";
}
DynarecCompilerWorkerCore.prototype.finish = function () {
    code += this.addClockChecks();
    code += this.instructionsToJoin.join(";");
    code += this.addStateMachineUpdate();
    done(code);
}
DynarecCompilerWorkerCore.prototype.decodeInstruction = function () {
    var genString = "";
    if (this.InTHUMB) {
        bailout();
        //genString = this.thumbAssembler.generate(instructionValue);
    }
    else {
        bailout();
        //genString = this.armAssembler.generate(instructionValue);
    }
    return genString;
}