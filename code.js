"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const stroke = {
    type: 'SOLID',
    color: { r: 0.7, g: 0.7, b: 0.7 }
};
figma.showUI(__html__, { height: 360, width: 480 });
// Global variable used to refer the correct and current page, even on page change
const currentPage = figma.currentPage;
figma.ui.onmessage = (msg) => {
    if (msg.type === "get-collections") {
        figma.variables.getLocalVariableCollectionsAsync().then((localCollections) => {
            const collections = [];
            for (const collection of localCollections) {
                collections.push(collection.name);
            }
            figma.ui.postMessage({
                type: "get-collections",
                body: collections
            });
        });
    }
    if (msg.type === "append-inspection-frame") {
        currentPage.loadAsync().then(() => {
            CleanUpInspectionFramesWrapper();
            GetCollectionId(msg.collection).then((collectionId) => {
                figma.notify("Adding Inspector to all frames... This can take a while depending on the number of frames/variables", { timeout: 5000 });
                AppendInspectionFramesWrapper(collectionId);
            });
        });
    }
    if (msg.type === "cancel") {
        figma.closePlugin();
    }
};
figma.on("currentpagechange", () => figma.closePlugin());
figma.on("close", CleanUpInspectionFramesWrapper);
function AppendInspectionFramesWrapper(collectionId) {
    // Helper function to recursively search through layers
    function processLayer(layer, collectionId) {
        if (layer.type === 'FRAME') {
            // Append frames directly
            AppendInspectionFrames(layer, collectionId);
        }
        // If the layer is a section, we need to check its children and go deeper if necessary
        if (layer.type === 'SECTION') {
            for (const sectionChild of layer.children) {
                // Recursively process each child
                processLayer(sectionChild, collectionId);
            }
        }
    }
    // Iterate through all the layers in the current page
    for (const layer of currentPage.children) {
        // Process each layer
        processLayer(layer, collectionId);
    }
}
function AppendInspectionFrames(layer, collectionId) {
    const inspectorFrame = figma.createFrame();
    layer.appendChild(inspectorFrame);
    if (layer.layoutMode !== "NONE") {
        inspectorFrame.layoutPositioning = "ABSOLUTE";
    }
    setInspectorFrameProperties(inspectorFrame, layer);
    Promise.all([
        figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
        figma.loadFontAsync({ family: "Inter", style: "Regular" })
    ]).then(() => {
        // title
        const title = figma.createText();
        inspectorFrame.appendChild(title);
        title.fontName = { family: "Inter", style: "Semi Bold" };
        title.fontSize = 16;
        title.characters = `Inspector`;
        title.layoutSizingHorizontal = "HUG";
        //subtitle
        const subTitle = figma.createText();
        inspectorFrame.appendChild(subTitle);
        subTitle.fontName = { family: "Inter", style: "Regular" };
        subTitle.fontSize = 12;
        subTitle.characters = `Scroll to see any clipped values`;
        subTitle.layoutSizingHorizontal = "HUG";
        // Container for variables array
        const variablesFrame = figma.createFrame();
        inspectorFrame.appendChild(variablesFrame);
        variablesFrame.name = "VariablesFrame";
        variablesFrame.layoutMode = "VERTICAL";
        variablesFrame.layoutSizingHorizontal = "HUG";
        variablesFrame.layoutSizingVertical = "HUG";
        variablesFrame.paddingTop = 12;
        figma.variables.getLocalVariablesAsync().then((localVariables) => {
            for (const variable of localVariables) {
                if ((variable.resolvedType === "STRING") && (variable.variableCollectionId === collectionId)) {
                    // Container for a single variable
                    const variableFrame = figma.createFrame();
                    variablesFrame.appendChild(variableFrame);
                    SetVariableFrameProperties(variableFrame);
                    // Variable name
                    const name = figma.createText();
                    variableFrame.appendChild(name);
                    SetTextProperties(name, "Semi Bold", `${variable.name}: `);
                    // Variable value
                    const value = figma.createText();
                    variableFrame.appendChild(value);
                    SetTextProperties(value, "Regular");
                    value.setBoundVariable("characters", variable);
                }
                if ((variable.resolvedType === "BOOLEAN") && (variable.variableCollectionId === collectionId)) {
                    // Container for a single variable
                    const variableFrame = figma.createFrame();
                    variablesFrame.appendChild(variableFrame);
                    SetVariableFrameProperties(variableFrame);
                    // Variable name
                    const name = figma.createText();
                    variableFrame.appendChild(name);
                    SetTextProperties(name, "Semi Bold", `${variable.name}: `);
                    // Variable truthy value show or hide
                    const truthy = figma.createText();
                    variableFrame.appendChild(truthy);
                    SetTextProperties(truthy, "Regular", "true");
                    truthy.setBoundVariable("visible", variable);
                }
            }
        });
    });
}
function CleanUpInspectionFramesWrapper() {
    // Helper function to recursively clean up frames
    function processLayer(layer) {
        if (layer.type === 'FRAME') {
            // Clean up frames directly
            CleanUpInspectionFrames(layer);
        }
        // If the layer is a section, recursively process its children
        if (layer.type === 'SECTION') {
            for (const sectionChild of layer.children) {
                // Recursively clean up each child
                processLayer(sectionChild);
            }
        }
    }
    // Iterate through all the layers in the current page
    for (const layer of currentPage.children) {
        // Process each layer
        processLayer(layer);
    }
}
function CleanUpInspectionFrames(layer) {
    // Iterate through all the children of the parent frame
    layer.children.forEach(child => {
        // Check if the child is the frame previously appended by name
        if (child.type === 'FRAME' && child.name === 'InspectorFrame') {
            // Remove the child frame
            child.remove();
        }
    });
}
function setInspectorFrameProperties(inspectorFrame, layer) {
    inspectorFrame.name = 'InspectorFrame';
    inspectorFrame.resize((layer.width * 0.25), (layer.height * 0.25));
    inspectorFrame.layoutMode = "VERTICAL";
    inspectorFrame.horizontalPadding = 4;
    inspectorFrame.verticalPadding = 4;
    inspectorFrame.itemSpacing = 0;
    inspectorFrame.overflowDirection = "BOTH";
    inspectorFrame.layoutSizingVertical = "HUG";
    inspectorFrame.layoutSizingHorizontal = "HUG";
    inspectorFrame.maxWidth = layer.width * 0.25;
    inspectorFrame.maxHeight = layer.height * 0.25;
    inspectorFrame.cornerRadius = 4;
    inspectorFrame.effects = [{
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            radius: 4,
            spread: 0,
            visible: true,
            blendMode: "PASS_THROUGH"
        }];
}
function SetTextProperties(textNode, fontWeight, textContent) {
    textNode.fontName = { family: "Inter", style: fontWeight };
    textNode.fontSize = 12;
    if (textContent)
        textNode.characters = textContent;
}
function SetVariableFrameProperties(variableFrame) {
    variableFrame.name = "VariableFrame";
    variableFrame.layoutMode = "HORIZONTAL";
    variableFrame.layoutWrap = "WRAP";
    variableFrame.layoutSizingHorizontal = "HUG";
    variableFrame.layoutSizingVertical = "HUG";
    variableFrame.strokes = [stroke];
    variableFrame.strokeWeight = 1;
    variableFrame.strokeAlign = 'OUTSIDE';
}
function GetCollectionId(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        const localCollections = yield figma.variables.getLocalVariableCollectionsAsync();
        for (const collection of localCollections) {
            if (collection.name === collectionName) {
                // Return the collection ID directly when found
                return collection.id;
            }
        }
        return "";
    });
}
