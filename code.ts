const fontSize = 16;
let doesNumberTypeVariableExist = false
let doesColorTypeVariableExist = false
const stroke: Paint = {
  type: 'SOLID',
  color: { r: 0.7, g: 0.7, b: 0.7 }
}

figma.showUI(__html__, { height: 500, width: 500 })

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === "get-variables") {
    figma.variables.getLocalVariablesAsync().then((localVariables) => {
      const variablesSanitisedArray = []
      for (const variable of localVariables) {
        if (variable.resolvedType === "BOOLEAN" || variable.resolvedType === "STRING") {
          variablesSanitisedArray.push({
            "name": variable.name,
            "type": variable.resolvedType
          })
        }
      }
      figma.ui.postMessage(variablesSanitisedArray)
    })
  }
  if (msg.type === "append-inspection-frame") {
    figma.variables.getLocalVariablesAsync().then((localVariables) => {
      AppendInspectionFrames(localVariables)
    })
  }

  if (msg.type === "cancel") {
    figma.closePlugin()
  }
}

figma.on("close", CleanUpInspectionFrames)

async function AppendInspectionFrames(localVariables: Variable[]) {
  const currentPage = figma.currentPage

  // Iterate through all the layers in the current page
  for (const layer of currentPage.children) {
    if (layer.type === 'FRAME') {
      const inspectorFrame = figma.createFrame();
      layer.appendChild(inspectorFrame)
      if (layer.layoutMode !== "NONE") {
        inspectorFrame.layoutPositioning = "ABSOLUTE"
      }
      setInspectorFrameProperties(inspectorFrame, layer)


      figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(async () => {
        const title = figma.createText()
        title.fontName = { family: "Inter", style: "Regular" }
        title.fontSize = fontSize
        title.characters = "Variables Inspector"
        inspectorFrame.appendChild(title)
        title.layoutSizingHorizontal = "FILL"

        // Container for variables array
        const variablesFrame = figma.createFrame()
        inspectorFrame.appendChild(variablesFrame)
        variablesFrame.name = "VariablesFrame"
        variablesFrame.layoutMode = "VERTICAL"
        variablesFrame.layoutSizingHorizontal = "FILL"
        variablesFrame.layoutSizingVertical = "HUG"

        for (const variable of localVariables) {
          if ((variable.resolvedType === "STRING")) {
            // Container for a single variable
            const variableFrame = figma.createFrame()
            variablesFrame.appendChild(variableFrame)
            SetVariableFrameProperties(variableFrame)

            // Variable name
            const name = figma.createText()
            variableFrame.appendChild(name)
            name.characters = `${variable.name}:`

            // Variable value
            const value = figma.createText()
            variableFrame.appendChild(value)
            value.setBoundVariable("characters", variable)
          }

          if ((variable.resolvedType === "BOOLEAN")) {
            // Container for a single variable
            const variableFrame = figma.createFrame()
            variablesFrame.appendChild(variableFrame)
            SetVariableFrameProperties(variableFrame)

            // Variable name
            const name = figma.createText()
            variableFrame.appendChild(name)
            name.characters = `${variable.name}:`

            // Variable truthy value show or hide
            const truthy = figma.createText()
            variableFrame.appendChild(truthy)
            truthy.characters = "true"
            truthy.setBoundVariable("visible", variable)
          }

          if (variable.resolvedType === "FLOAT")
            doesNumberTypeVariableExist = true
          if (variable.resolvedType === "COLOR")
            doesColorTypeVariableExist = true
        }
      })
    }
  }
  setTimeout(() => {
    if (doesNumberTypeVariableExist === true)
      figma.notify("Number type variables cannot be inspected due to Figma limitations")
    if (doesColorTypeVariableExist === true)
      figma.notify("Color type variables are currently not supported")
  }, 1000);
}

function CleanUpInspectionFrames() {
  const currentPage = figma.currentPage

  // Iterate through all the layers in the current page
  currentPage.children.forEach(layer => {
    // Check if the layer is a frame
    if (layer.type === 'FRAME') {

      // Iterate through all the children of the parent frame
      layer.children.forEach(child => {
        // Check if the child is the frame previously appended by name
        if (child.type === 'FRAME' && child.name === 'InspectorFrame') {
          // Remove the child frame
          child.remove()
        }
      });
    }
  });
}

function setInspectorFrameProperties(inspectorFrame: FrameNode, layer: FrameNode) {
  inspectorFrame.name = 'InspectorFrame'
  inspectorFrame.resize((layer.width * 0.25), (layer.height * 0.25))
  inspectorFrame.layoutMode = "VERTICAL"
  inspectorFrame.horizontalPadding = 4
  inspectorFrame.verticalPadding = 4
  inspectorFrame.itemSpacing = 4
  inspectorFrame.overflowDirection = "BOTH";
  inspectorFrame.layoutSizingVertical = "HUG"
  inspectorFrame.layoutSizingHorizontal = "HUG"
  inspectorFrame.maxWidth = layer.width * 0.25
  inspectorFrame.maxHeight = layer.height * 0.25
  inspectorFrame.cornerRadius = 4
  inspectorFrame.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 4 },
    radius: 4,
    spread: 0,
    visible: true,
    blendMode: "PASS_THROUGH"
  }]
}

function SetTextProperties(textNode: TextNode, textContent: string) {
  textNode.fontName = { family: "Inter", style: "Regular" }
  textNode.fontSize = fontSize
  textNode.characters = textContent
}

function SetVariableFrameProperties(variableFrame: FrameNode) {
  variableFrame.name = "VariableFrame"
  variableFrame.layoutMode = "HORIZONTAL"
  variableFrame.layoutWrap = "WRAP"
  variableFrame.layoutSizingHorizontal = "FILL"
  variableFrame.layoutSizingVertical = "HUG"
  variableFrame.strokes = [stroke]
  variableFrame.strokeWeight = 1
  variableFrame.strokeAlign = 'OUTSIDE'
}
