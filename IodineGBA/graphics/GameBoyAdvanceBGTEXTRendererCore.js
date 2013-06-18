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
function GameBoyAdvanceBGTEXTRenderer(gfx, BGLayer) {
	this.gfx = gfx;
    this.VRAM = this.gfx.VRAM;
    this.VRAM16 = this.gfx.VRAM16;
    this.fetchTile = (this.VRAM16) ? this.fetchTileOptimized : this.fetchTileNormal;
    this.BGLayer = BGLayer | 0;
	this.initialize();
}
GameBoyAdvanceBGTEXTRenderer.prototype.initialize = function () {
	this.scratchBuffer = getInt32Array(248);
	this.BGXCoord = 0;
	this.BGYCoord = 0;
    this.palettePreprocess();
    this.screenSizePreprocess();
    this.priorityPreprocess();
    this.screenBaseBlockPreprocess();
    this.characterBaseBlockPreprocess();
}
GameBoyAdvanceBGTEXTRenderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    if (this.gfx.BGMosaic[this.BGLayer | 0]) {
		//Correct line number for mosaic:
		line -= this.gfx.mosaicRenderer.getMosaicYOffset(line | 0) | 0;
        line = (line | 0) | 0;
	}
	var yTileOffset = ((line | 0) + (this.BGYCoord | 0)) & 0x7;
	var pixelPipelinePosition = this.BGXCoord & 0x7;
    var yTileStart = ((line | 0) + (this.BGYCoord | 0)) >> 3;
    var xTileStart = this.BGXCoord >> 3;
	for (var position = 0; (position | 0) < 240;) {
		var chrData = this.fetchTile(yTileStart | 0, xTileStart | 0) | 0;
        xTileStart = (xTileStart + 1) | 0;
		while ((pixelPipelinePosition | 0) < 0x8) {
			this.scratchBuffer[position | 0] = (this.priorityFlag | 0) | (this.fetchVRAM(chrData | 0, pixelPipelinePosition | 0, yTileOffset | 0) | 0);
            pixelPipelinePosition = (pixelPipelinePosition + 1) | 0;
            position = (position + 1) | 0;
		}
		pixelPipelinePosition &= 0x7;
	}
	if (this.gfx.BGMosaic[this.BGLayer | 0]) {
		//Pixelize the line horizontally:
		this.gfx.mosaicRenderer.renderMosaicHorizontal(this.scratchBuffer);
	}
	return this.scratchBuffer;
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetchTileNormal = function (yTileStart, xTileStart) {
    yTileStart = yTileStart | 0;
    xTileStart = xTileStart | 0;
    //Find the tile code to locate the tile block:
	var address = this.computeScreenMapAddress8(this.computeTileNumber(yTileStart | 0, xTileStart | 0) | 0) | 0;
	return (this.VRAM[address | 1] << 8) | this.VRAM[address | 0];
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetchTileOptimized = function (yTileStart, xTileStart) {
    yTileStart = yTileStart | 0;
    xTileStart = xTileStart | 0;
    //Find the tile code to locate the tile block:
	var address = this.computeScreenMapAddress16(this.computeTileNumber(yTileStart | 0, xTileStart | 0) | 0) | 0;
	return this.VRAM16[address | 0] | 0;
}
GameBoyAdvanceBGTEXTRenderer.prototype.computeTileNumber = function (yTile, xTile) {
	yTile = yTile | 0;
    xTile = xTile | 0;
    //Return the true tile number:
    return ((((yTile & this.tileHeight) << 5) + ((xTile & this.tileWidth) << 5)) | (xTile & 0x1F)) | 0;
}
GameBoyAdvanceBGTEXTRenderer.prototype.computeScreenMapAddress8 = function (tileNumber) {
	tileNumber = tileNumber | 0;
    return ((tileNumber << 1) | this.BGScreenBaseBlock8) & 0xFFFF;
}
GameBoyAdvanceBGTEXTRenderer.prototype.computeScreenMapAddress16 = function (tileNumber) {
	tileNumber = tileNumber | 0;
    return (tileNumber | this.BGScreenBaseBlock16) & 0x7FFF;
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetch4BitVRAM = function (chrData, xOffset, yOffset) {
    chrData = chrData | 0;
    xOffset = xOffset | 0;
    yOffset = yOffset | 0;
    //Parse flip attributes, grab palette, and then output pixel:
	var address = (chrData & 0x3FF) << 5;
	address = ((address | 0) + (this.baseBlockOffset | 0)) | 0;
	address = ((address | 0) + ((((chrData & 0x800) == 0x800) ? (0x7 - (yOffset | 0)) : (yOffset | 0)) << 2));
	address = ((address | 0) + ((((chrData & 0x400) == 0x400) ? (0x7 - (xOffset | 0)) : (xOffset | 0)) >> 1));
	if ((xOffset & 0x1) == ((chrData & 0x400) >> 10)) {
		return this.palette[chrData >> 12][this.VRAM[address | 0] & 0xF] | 0;
	}
	return this.palette[chrData >> 12][this.VRAM[address | 0] >> 4] | 0;
}
GameBoyAdvanceBGTEXTRenderer.prototype.fetch8BitVRAM = function (chrData, xOffset, yOffset) {
    chrData = chrData | 0;
    xOffset = xOffset | 0;
    yOffset = yOffset | 0;
    //Parse flip attributes and output pixel:
	var address = (chrData & 0x3FF) << 6;
	address = ((address | 0) + (this.baseBlockOffset | 0)) | 0;
	address = ((address | 0) + ((((chrData & 0x800) == 0x800) ? (0x7 - (yOffset | 0)) : (yOffset | 0)) << 3)) | 0;
	address = ((address | 0) + ((((chrData & 0x400) == 0x400) ? (0x7 - (xOffset | 0)) : (xOffset | 0)) | 0)) | 0;
	return this.palette[this.VRAM[address | 0] | 0] | 0;
}
GameBoyAdvanceBGTEXTRenderer.prototype.palettePreprocess = function () {
	if (this.gfx.BGPalette256[this.BGLayer | 0]) {
		this.palette = this.gfx.palette256;
		this.fetchVRAM = this.fetch8BitVRAM;
	}
	else {
		this.palette = this.gfx.palette16;
		this.fetchVRAM = this.fetch4BitVRAM;
	}
}
GameBoyAdvanceBGTEXTRenderer.prototype.screenSizePreprocess = function () {
    this.tileWidth = (this.gfx.BGScreenSize[this.BGLayer | 0] & 0x1) << 0x5;
    this.tileHeight = ((0x20 << ((this.gfx.BGScreenSize[this.BGLayer | 0] & 0x2) - 1)) - 1) | 0;
}
GameBoyAdvanceBGTEXTRenderer.prototype.priorityPreprocess = function () {
	this.priorityFlag = (this.gfx.BGPriority[this.BGLayer | 0] << 23) | (1 << ((this.BGLayer | 0) + 0x10));
}
GameBoyAdvanceBGTEXTRenderer.prototype.screenBaseBlockPreprocess = function () {
	this.BGScreenBaseBlock8 = this.gfx.BGScreenBaseBlock[this.BGLayer | 0] << 11;
    this.BGScreenBaseBlock16 = this.BGScreenBaseBlock8 >> 1;
}
GameBoyAdvanceBGTEXTRenderer.prototype.characterBaseBlockPreprocess = function () {
	this.baseBlockOffset = this.gfx.BGCharacterBaseBlock[this.BGLayer | 0] << 14;
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGHOFS0 = function (data) {
	data = data | 0;
    this.BGXCoord = (this.BGXCoord & 0x100) | data;
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGHOFS1 = function (data) {
	data = data | 0;
    this.BGXCoord = ((data & 0x01) << 8) | (this.BGXCoord & 0xFF);
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGVOFS0 = function (data) {
	data = data | 0;
    this.BGYCoord = (this.BGYCoord & 0x100) | data;
}
GameBoyAdvanceBGTEXTRenderer.prototype.writeBGVOFS1 = function (data) {
	data = data | 0;
    this.BGYCoord = ((data & 0x01) << 8) | (this.BGYCoord & 0xFF);
}