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
function GameBoyAdvanceWindowRenderer(gfx) {
	this.gfx = gfx;
    this.backdrop = this.gfx.backdrop | 0;
    this.WINXCoordRight = 0;
	this.WINXCoordLeft = 0;
    this.WINYCoordBottom = 0;
	this.WINYCoordTop = 0;
    this.WINBG0 = false;
	this.WINBG1 = false;
	this.WINBG2 = false;
	this.WINBG3 = false;
	this.WINOBJ = false;
	this.WINEffects = false;
	this.preprocess();
}
GameBoyAdvanceWindowRenderer.prototype.renderNormalScanLine = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
	//Arrange our layer stack so we can remove disabled and order for correct edge case priority:
	OBJBuffer = (this.WINOBJ) ? OBJBuffer : null;
	BG0Buffer = (this.WINBG0) ? BG0Buffer : null;
	BG1Buffer = (this.WINBG1) ? BG1Buffer : null;
	BG2Buffer = (this.WINBG2) ? BG2Buffer : null;
	BG3Buffer = (this.WINBG3) ? BG3Buffer : null;
	var layerStack = this.gfx.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
	var stackDepth = layerStack.length | 0;
	var stackIndex = 0;
	if ((this.WINYCoordTop | 0) <= (line | 0) && (line | 0) < (this.WINYCoordBottom | 0)) {
		//Loop through each pixel on the line:
		for (var pixelPosition = this.WINXCoordLeft | 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0, endPosition = Math.min(this.WINXCoordRight | 0, 240) | 0; (pixelPosition | 0) < (endPosition | 0); pixelPosition = ((pixelPosition | 0) + 1) | 0) {
			//Start with backdrop color:
			lowerPixel = currentPixel = this.backdrop | 0;
			//Loop through all layers each pixel to resolve priority:
			for (stackIndex = 0; (stackIndex | 0) < (stackDepth | 0); stackIndex = ((stackIndex | 0) + 1) | 0) {
				workingPixel = layerStack[stackIndex | 0][pixelPosition | 0];
				if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
					/*
						If higher priority than last pixel and not transparent.
						Also clear any plane layer bits other than backplane for
						transparency.
						
						Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
					*/
					lowerPixel = currentPixel | 0;
					currentPixel = workingPixel | 0;
				}
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
					/*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
					lowerPixel = workingPixel | 0;
				}
			}
			if ((currentPixel & 0x400000) == 0) {
				//Normal Pixel:
				lineBuffer[pixelPosition | 0] = currentPixel | 0;
			}
			else {
				//OAM Pixel Processing:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
			}
		}
	}
}
GameBoyAdvanceWindowRenderer.prototype.renderScanLineWithEffects = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
	//Arrange our layer stack so we can remove disabled and order for correct edge case priority:
	OBJBuffer = (this.WINOBJ) ? OBJBuffer : null;
	BG0Buffer = (this.WINBG0) ? BG0Buffer : null;
	BG1Buffer = (this.WINBG1) ? BG1Buffer : null;
	BG2Buffer = (this.WINBG2) ? BG2Buffer : null;
	BG3Buffer = (this.WINBG3) ? BG3Buffer : null;
	var layerStack = this.gfx.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
	var stackDepth = layerStack.length | 0;
	var stackIndex = 0;
	if ((this.WINYCoordTop | 0) <= (line | 0) && (line | 0) < (this.WINYCoordBottom | 0)) {
		//Loop through each pixel on the line:
		for (var pixelPosition = this.WINXCoordLeft | 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0, endPosition = Math.min(this.WINXCoordRight | 0, 240) | 0; (pixelPosition | 0) < (endPosition | 0); pixelPosition = ((pixelPosition | 0) + 1) | 0) {
			//Start with backdrop color:
			lowerPixel = currentPixel = this.backdrop | 0;
			//Loop through all layers each pixel to resolve priority:
			for (stackIndex = 0; (stackIndex | 0) < (stackDepth | 0); stackIndex = ((stackIndex | 0) + 1) | 0) {
				workingPixel = layerStack[stackIndex | 0][pixelPosition | 0] | 0;
				if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
					/*
						If higher priority than last pixel and not transparent.
						Also clear any plane layer bits other than backplane for
						transparency.
						
						Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
					*/
					lowerPixel = currentPixel | 0;
					currentPixel = workingPixel | 0;
				}
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
					/*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
					lowerPixel = workingPixel | 0;
				}
			}
			if ((currentPixel & 0x400000) == 0) {
				//Normal Pixel:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
			}
			else {
				//OAM Pixel Processing:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
			}
		}
	}
}
GameBoyAdvanceWindowRenderer.prototype.preprocess = function () {
	this.renderScanLine = (this.WINEffects) ? this.renderScanLineWithEffects : this.renderNormalScanLine;
}
GameBoyAdvanceWindowRenderer.prototype.writeWINH0 = function (data) {
	this.WINXCoordRight = data | 0;		//Window x-coord goes up to this minus 1.
}
GameBoyAdvanceWindowRenderer.prototype.writeWINH1 = function (data) {
	this.WINXCoordLeft = data | 0;
}
GameBoyAdvanceWindowRenderer.prototype.writeWINV0 = function (data) {
	this.WINYCoordBottom = data | 0;	//Window y-coord goes up to this minus 1.
}
GameBoyAdvanceWindowRenderer.prototype.writeWINV1 = function (data) {
	this.WINYCoordTop = data | 0;
}
GameBoyAdvanceWindowRenderer.prototype.writeWININ = function (data) {
    data = data | 0;
    this.WINBG0 = ((data & 0x01) == 0x01);
    this.WINBG1 = ((data & 0x02) == 0x02);
    this.WINBG2 = ((data & 0x04) == 0x04);
    this.WINBG3 = ((data & 0x08) == 0x08);
    this.WINOBJ = ((data & 0x10) == 0x10);
    this.WINEffects = ((data & 0x20) == 0x20);
    this.preprocess();
}
GameBoyAdvanceWindowRenderer.prototype.readWININ = function () {
    return ((this.WINBG0 ? 0x1 : 0) |
            (this.WINBG1 ? 0x2 : 0) |
            (this.WINBG2 ? 0x4 : 0) |
            (this.WINBG3 ? 0x8 : 0) |
            (this.WINOBJ ? 0x10 : 0) |
            (this.WINEffects ? 0x20 : 0));
}