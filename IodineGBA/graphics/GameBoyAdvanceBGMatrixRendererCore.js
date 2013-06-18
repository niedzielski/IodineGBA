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
function GameBoyAdvanceBGMatrixRenderer(gfx, BGLayer) {
	this.gfx = gfx;
    this.BGLayer = BGLayer;
    this.VRAM = this.gfx.VRAM;
    this.palette = this.gfx.palette256;
    this.transparency = this.gfx.transparency;
    this.bgAffineRenderer = this.gfx.bgAffineRenderer[BGLayer & 0x1];
	this.screenSizePreprocess();
    this.screenBaseBlockPreprocess();
    this.characterBaseBlockPreprocess();
    this.displayOverflowPreprocess();
}
GameBoyAdvanceBGMatrixRenderer.prototype.tileMapSize = [
	0x80,
	0x100,
	0x200,
	0x400
];
GameBoyAdvanceBGMatrixRenderer.prototype.renderScanLine = function (line) {
	return this.bgAffineRenderer.renderScanLine(line | 0, this);
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchTile = function (tileNumber) {
	//Find the tile code to locate the tile block:
	return this.VRAM[(tileNumber + this.BGScreenBaseBlock) & 0xFFFF];
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchPixel = function (x, y) {
    x = x | 0;
    y = y | 0;
    var mapSizeComparer = this.mapSizeComparer | 0;
    //Output pixel:
	if (x > mapSizeComparer || y > mapSizeComparer) {
		//Overflow Handling:
		if (this.BGDisplayOverflow) {
			x &= mapSizeComparer | 0;
			y &= mapSizeComparer | 0;
		}
		else {
			return this.transparency | 0;
		}
	}
    var mapSize = this.mapSize | 0;
	var address = this.fetchTile((x >> 3) + ((y >> 3) * mapSize)) << 6;
	address += this.baseBlockOffset | 0;
	address += (y & 0x7) << 3;
	address += x & 0x7;
	return this.palette[this.VRAM[address | 0] | 0] | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenSizePreprocess = function () {
	this.mapSize = this.tileMapSize[this.gfx.BGScreenSize[this.BGLayer]];
	this.mapSizeComparer = this.mapSize - 1;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenBaseBlockPreprocess = function () {
	this.BGScreenBaseBlock = this.gfx.BGScreenBaseBlock[this.BGLayer] << 11;
}
GameBoyAdvanceBGMatrixRenderer.prototype.characterBaseBlockPreprocess = function () {
	this.baseBlockOffset = this.gfx.BGCharacterBaseBlock[this.BGLayer] << 14;
}
GameBoyAdvanceBGMatrixRenderer.prototype.displayOverflowPreprocess = function () {
	this.BGDisplayOverflow = this.gfx.BGDisplayOverflow[this.BGLayer];
}