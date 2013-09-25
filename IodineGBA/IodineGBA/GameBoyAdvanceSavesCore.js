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
    this.cartridge = IOCore.cartridge;
    this.initialize();
}
GameBoyAdvanceSaves.prototype.initialize = function () {
    this.saveType = 1;
    this.gpioType = 0;
    this.GPIOChip = null;
    this.UNDETERMINED = null;//new GameboyAdvanceSaveDeterminer();
    this.SRAMChip = new GameBoyAdvanceSRAMChip();
    this.FLASHChip = new GameBoyAdvanceFLASHChip();
    this.EEPROMChip = null;//new GameBoyAdvanceEEPROMChip();
    this.referenceSave();
}
GameBoyAdvanceSaves.prototype.referenceSave = function () {
    switch (this.saveType | 0) {
        case 1:
            this.saves = this.SRAMChip.SRAM;
            break;
        case 2:
            this.saves = this.FLASHChip.FLASH;
            break;
        case 3:
            this.saves = this.EEPROMChip.EEPROM;
            break;
        default:
            this.saves = null;
    }
}
GameBoyAdvanceSaves.prototype.importSave = function (saves) {
    this.saves = saves;
    this.SRAMChip.load(this.saves);
    this.FLASHChip.load(this.saves);
    //this.EEPROMChip.load(this.saves);
}
GameBoyAdvanceSaves.prototype.exportSave = function () {
    return this.saves;
}
GameBoyAdvanceSaves.prototype.readGPIO8 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.gpioType | 0) > 0) {
        //GPIO:
        data = this.GPIOChip.read8(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly8(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readEEPROM8 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.saveType | 0) == 3) {
        //EEPROM:
        data = this.EEPROMChip.read8(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly8(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readGPIO16 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.gpioType | 0) > 0) {
        //GPIO:
        data = this.GPIOChip.read16(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly16(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readEEPROM16 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.saveType | 0) == 3) {
        //EEPROM:
        data = this.EEPROMChip.read16(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly16(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readGPIO32 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.gpioType | 0) > 0) {
        //GPIO:
        data = this.GPIOChip.read32(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly32(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readEEPROM32 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.saveType | 0) == 3) {
        //EEPROM:
        data = this.EEPROMChip.read32(address | 0) | 0;
    }
    else {
        //ROM:
        data = this.cartridge.readROMOnly32(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.readSRAM = function (address) {
    address = address | 0;
    var data = 0;
    switch (this.saveType | 0) {
        case 0:
            //Unknown:
            data = this.UNDETERMINED.readSRAM(address | 0) | 0;
            break;
        case 1:
            //SRAM:
            data = this.SRAMChip.read(address | 0) | 0;
            break;
        case 2:
            //FLASH:
            data = this.FLASHChip.read(address | 0) | 0;
    }
    return data | 0;
}
GameBoyAdvanceSaves.prototype.writeGPIO8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    if ((this.gpioType | 0) > 0) {
        //GPIO:
        this.GPIOChip.write(address | 0, data | 0);
    }
    else {
        //Unknown:
        //this.UNDETERMINED.writeGPIO(address | 0, data | 0);
    }
}
GameBoyAdvanceSaves.prototype.writeEEPROM8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    if ((this.saveType | 0) == 3) {
        //EEPROM:
        this.EEPROMChip.write(address | 0, data | 0);
    }
    else {
        //Unknown:
        //this.UNDETERMINED.writeEEPROM(address | 0, data | 0);
    }
}
GameBoyAdvanceSaves.prototype.writeSRAM = function (address, data) {
    address = address | 0;
    data = data | 0;
    switch (this.saveType | 0) {
        case 0:
            //Unknown:
            this.UNDETERMINED.writeSRAM(address | 0, data | 0);
            break;
        case 1:
            //SRAM:
            this.SRAMChip.write(address | 0, data | 0);
            break;
        case 2:
            //FLASH:
            this.FLASHChip.write(address | 0, data | 0);
    }
}