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
	var stackDepth = layerStack.length;
	var stackIndex = 0;
	if (this.WINYCoordTop <= line && line < this.WINYCoordBottom) {
		//Loop through each pixel on the line:
		for (var pixelPosition = this.WINXCoordLeft, currentPixel = 0, workingPixel = 0, lowerPixel = 0, endPosition = Math.min(this.WINXCoordRight, 240); pixelPosition < endPosition; ++pixelPosition) {
			//Start with backdrop color:
			lowerPixel = currentPixel = this.gfx.backdrop;
			//Loop through all layers each pixel to resolve priority:
			for (stackIndex = 0; stackIndex < stackDepth; ++stackIndex) {
				workingPixel = layerStack[stackIndex][pixelPosition];
				if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
					/*
						If higher priority than last pixel and not transparent.
						Also clear any plane layer bits other than backplane for
						transparency.
						
						Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
					*/
					lowerPixel = currentPixel;
					currentPixel = workingPixel;
				}
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
					/*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
					lowerPixel = workingPixel;
				}
			}
			if ((currentPixel & 0x400000) == 0) {
				//Normal Pixel:
				lineBuffer[pixelPosition] = currentPixel;
			}
			else {
				//OAM Pixel Processing:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel, currentPixel);
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
	var stackDepth = layerStack.length;
	var stackIndex = 0;
	if (this.WINYCoordTop <= line && line < this.WINYCoordBottom) {
		//Loop through each pixel on the line:
		for (var pixelPosition = this.WINXCoordLeft, currentPixel = 0, workingPixel = 0, lowerPixel = 0, endPosition = Math.min(this.WINXCoordRight, 240); pixelPosition < endPosition; ++pixelPosition) {
			//Start with backdrop color:
			lowerPixel = currentPixel = this.gfx.backdrop;
			//Loop through all layers each pixel to resolve priority:
			for (stackIndex = 0; stackIndex < stackDepth; ++stackIndex) {
				workingPixel = layerStack[stackIndex][pixelPosition];
				if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
					/*
						If higher priority than last pixel and not transparent.
						Also clear any plane layer bits other than backplane for
						transparency.
						
						Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
					*/
					lowerPixel = currentPixel;
					currentPixel = workingPixel;
				}
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
					/*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
					lowerPixel = workingPixel;
				}
			}
			if ((currentPixel & 0x400000) == 0) {
				//Normal Pixel:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition] = this.gfx.colorEffectsRenderer.process(lowerPixel, currentPixel);
			}
			else {
				//OAM Pixel Processing:
				//Pass the highest two pixels to be arbitrated in the color effects processing:
				lineBuffer[pixelPosition] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel, currentPixel);
			}
		}
	}
}
GameBoyAdvanceWindowRenderer.prototype.preprocess = function () {
	this.renderScanLine = (this.WINEffects) ? this.renderScanLineWithEffects : this.renderNormalScanLine;
}