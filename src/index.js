const REPLACE = 0
const REORDER = 1
const ATTR = 2
const TEXT = 3

const utils = {
  isString: input => {
    let type = typeof input
    return type == "string" || type == "number"
  },

}

class Element {
  constructor (tagName, attributes, children) {
    this.tagName = tagName
    this.attributes = attributes || {}
    this.children = children || []
  }

  render () {
    let el = document.createElement(this.tagName)
    let attributes = this.attributes
    let children = this.children

    for (let attrName in attributes) {
      el.setAttribute(attrName, attributes[attrName])
    }

    children.map(child => {
      let childEl = (child instanceof Element)
        ? child.render()
        : document.createTextNode(child)
      el.appendChild(childEl)
    })

    return el
  }
}

function h(name, attributes) {
  let node
  let rest = []
  let children = []
  let length = arguments.length

  while (length-- > 2) rest.push(arguments[length])

  while (rest.length) {
    if ((node = rest.pop()) && node.pop) {
      for (length = node.length; length--; ) {
        rest.push(node[length])
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node)
    }
  }

  return typeof name === "function"
    ? name(attributes || {}, children)
    : new Element(name, attributes, children)
}

function diff(oldTree, newTree) {
  let indexObj =  { index: 0 }
  let patches = {}

  dfs(oldTree, newTree, indexObj, patches)

  return patches
}

function dfs(oldNode, newNode, indexObj, patches) {
  let tempPatch = []
  let count = 0
  let tempIndex = indexObj.index
  
  indexObj.index++

  if (utils.isString(oldNode) && utils.isString(newNode) && oldNode !== newNode) {
    tempPatch.push({
      type: TEXT,
      content: newNode
    })
  } else if (oldNode.tagName === newNode.tagName) {
    let attrPatches = diffAttr(oldNode, newNode)

    if (attrPatches) {
      tempPatch.push({
        type: ATTR,
        attr: attrPatches
      })
    }

    if (oldNode instanceof Element && oldNode.children.length) {
      oldNode.children.map((child, i) => {
        childPatch = dfs(child, newNode.children[i], indexObj, patches)
      })
    }
    
  } else {
    tempPatch.push({
      type: REPLACE,
      node: newNode
    })
  }

  if (tempPatch.length) {
    patches[tempIndex] = tempPatch
  }

  return patches
}

function diffAttr(oldNode, newNode) {
  let count = 0
  let oldAttr = oldNode.attributes
  let newAttr = newNode.attributes

  let attrPatches = {}

  for (let key in oldAttr) {
    let value = oldAttr[key]
    if (newAttr[key] !== value) {
      count++
      attrPatches[key] = newAttr[key]
    }
  }

  for (let key in newAttr) {
    let value = newAttr[key]
    if (!oldNode.hasOwnProperty(key)) {
      count++
      attrPatches[key] = value
    }
  }

  if (count > 0) return attrPatches

  return null

}


function patch(node, patches) {
  let indexObj = { index: 0 }
  dfsPatch(node, patches, indexObj)
}

function dfsPatch(node, patches, indexObj) {
  let tempPatch = patches[indexObj.index]

  node.childNodes.map((child, i) => {
    indexObj.index++
    dfsPatch(child, patches, indexObj)
  })

  tempPatch.map(patch => {
    switch (patch.type) {
      case REPLACE:
        node.parentNode.replaceChild(patch.node.render(), node)
        break
      case REORDER:
        // reorderChildren(node, currentPatch.moves)
        break
      case ATTR:
        // setProps(node, currentPatch.props)
        break
      case TEXT:
        node.textContent = patch.content
        break
      default:
        throw new Error('Unknown patch type ' + currentPatch.type)
    }
  })
}

function updateAttr(element, name, value) {
  if (name === "key") {
  } else if (name === "style") {
    for (var i in clone(oldValue, value)) {
      element[name][i] = value == null || value[i] == null ? "" : value[i]
    }
  } else {
    if (typeof value === "function" || (name in element && name !== "list" && !isSVG)) {
      element[name] = value == null ? "" : value
    } else if (value != null && value !== false) {
      element.setAttribute(name, value)
    }

    if (value == null || value === false) {
      element.removeAttribute(name)
    }
  }
}

// test code

let vdom1 = h("div", {}, [
  h("h1", {}, 0),
  h("button", { }, "-"),
  h("button", { }, "+")
])

let vdom2 = h("div", {}, [
  h("h1", {}, 1),
  h("button", { key: 'hashKey' }, "-"),
  h("ul", {}, [
    h("li", {}, 'test'),
    h('li', {}, 'test2')
  ])
])

let compare = diff(vdom1, vdom2)

console.log(compare)