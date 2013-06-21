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
	line = line | 0;
    return this.bgAffineRenderer.renderScanLine(line | 0, this);
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchTile = function (tileNumber) {
	tileNumber = tileNumber | 0;
    //Find the tile code to locate the tile block:
	return this.VRAM[((tileNumber | 0) + (this.BGScreenBaseBlock | 0)) & 0xFFFF];
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchPixel = function (x, y) {
    x = x | 0;
    y = y | 0;
    var mapSizeComparer = this.mapSizeComparer | 0;
    //Output pixel:
	if ((x | 0) < 0 || (y | 0) < 0 || (x | 0) > (mapSizeComparer | 0) || (y | 0) > (mapSizeComparer | 0)) {
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
	var address = this.fetchTile((x >> 3) + ((y >> 3) * (mapSize >> 3))) << 6;
	address = ((address | 0) + (this.BGCharacterBaseBlock | 0)) | 0;
	address = ((address | 0) + ((y & 0x7) << 3)) | 0;
	address = ((address | 0) + (x & 0x7)) | 0;
	return this.palette[this.VRAM[address & 0xFFFF] | 0] | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenSizePreprocess = function () {
	this.mapSize = this.tileMapSize[this.gfx.BGScreenSize[this.BGLayer | 0] | 0] | 0;
	this.mapSizeComparer = ((this.mapSize | 0) - 1) | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenBaseBlockPreprocess = function () {
	this.BGScreenBaseBlock = this.gfx.BGScreenBaseBlock[this.BGLayer | 0] << 11;
}
GameBoyAdvanceBGMatrixRenderer.prototype.characterBaseBlockPreprocess = function () {
	this.BGCharacterBaseBlock = this.gfx.BGCharacterBaseBlock[this.BGLayer | 0] << 14;
}
GameBoyAdvanceBGMatrixRenderer.prototype.displayOverflowPreprocess = function () {
	this.BGDisplayOverflow = this.gfx.BGDisplayOverflow[this.BGLayer | 0];
}