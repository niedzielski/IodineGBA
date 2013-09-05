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
function GameBoyAdvanceSaves(IOCore) {
	this.IOCore = IOCore;
	this.initialize();
}
GameBoyAdvanceSaves.prototype.initialize = function () {
    this.SRAM = getUint8Array(0x10000);
    this.FLASHOffset = 0x2000000;
    if ((this.IOCore.cartridge.ROMLength | 0) < 0x2000000) {
        this.FLASHOffset = ((this.FLASHOffset | 0) - (this.IOCore.cartridge.ROMLength | 0)) | 0;
        this.FLASH = getUint8Array(this.FLASHOffset | 0);
    }
}
GameBoyAdvanceSaves.prototype.readGPIO8 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly8(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readFLASH8 = function (address) {
    address = address | 0;
    var offset = ((address | 0) - (this.FLASHOffset | 0)) | 0;
    if ((offset | 0) >= 0) {
        return this.FLASH[offset | 0] | 0;
    }
    else {
        return this.IOCore.cartridge.readROMOnly8(address | 0) | 0;
    }
}
GameBoyAdvanceSaves.prototype.readEEPROM8 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly8(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readGPIO16 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly16(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readFLASH16 = function (address) {
    address = address | 0;
    var offset = ((address | 0) - (this.FLASHOffset | 0)) | 0;
    if ((offset | 0) >= 0) {
        return this.FLASH[offset | 0] | (this.FLASH[offset | 1] << 8);
    }
    else {
        return this.IOCore.cartridge.readROMOnly16(address | 0) | 0;
    }
}
GameBoyAdvanceSaves.prototype.readEEPROM16 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly16(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readGPIO32 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly32(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readFLASH32 = function (address) {
    address = address | 0;
    var offset = ((address | 0) - (this.FLASHOffset | 0)) | 0;
    if ((offset | 0) >= 0) {
        return this.FLASH[offset | 0] | (this.FLASH[offset | 1] << 8) | (this.FLASH[offset | 2] << 16) | (this.FLASH[offset | 3] << 24);
    }
    else {
        return this.IOCore.cartridge.readROMOnly32(address | 0) | 0;
    }
}
GameBoyAdvanceSaves.prototype.readEEPROM32 = function (address) {
    address = address | 0;
    return this.IOCore.cartridge.readROMOnly32(address | 0) | 0;
}
GameBoyAdvanceSaves.prototype.readSRAM = function (address) {
    address = address | 0;
    return this.SRAM[address & 0xFFFF] | 0;
}
GameBoyAdvanceSaves.prototype.writeGPIO8 = function (address, data) {
    address = address | 0;
    data = data | 0;
}
GameBoyAdvanceSaves.prototype.writeFLASH8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    var offset = ((address | 0) - (this.FLASHOffset | 0)) | 0;
    if ((offset | 0) >= 0) {
        this.FLASH[offset | 0] = data | 0;
    }
}
GameBoyAdvanceSaves.prototype.writeROM8 = function (address, data) {
    address = address | 0;
    data = data | 0;
}
GameBoyAdvanceSaves.prototype.writeSRAM = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.SRAM[address & 0xFFFF] = data | 0;
}