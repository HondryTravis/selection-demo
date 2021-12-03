export function getKeysOf(obj) {
    return Reflect.ownKeys(obj) || Object.keys(obj)
}

// 比较节点位置
export function isBefore(node1, node2) {
    return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING)
}
// 获得节点 next 的首个节点
export function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild
    }
    return nextNodeDescendants(node)
}

export function nextNodeDescendants(node) {
    while (node && !node.nextSibling) {
        node = node.parentNode
    }
    if (!node) {
        return null
    }
    return node.nextSibling
}

// 获得当前 node 的index
export function getNodeIndex(node) {
    let ret = 0
    while (node.previousSibling) {
        ret++
        node = node.previousSibling;
    }
    return ret
}

// 获得节点的具体长度
export function getNodeLength(node) {
    switch (node.nodeType) {
        case Node.PROCESSING_INSTRUCTION_NODE:
        case Node.DOCUMENT_TYPE_NODE:
            return 0;

        case Node.TEXT_NODE:
        case Node.COMMENT_NODE:
            return node.length;

        default:
            return node.childNodes.length;
    }
}

// 获得节点位置
export function getPosition(nodeA, offsetA, nodeB, offsetB) {
    if (nodeA == nodeB) {
        if (offsetA == offsetB) return 'equal'

        if (offsetA < offsetB) return 'before'

        if (offsetA > offsetB) return 'after'
    }

    if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_FOLLOWING) {
        const pos = getPosition(nodeB, offsetB, nodeA, offsetA);
        if (pos == 'before') return 'after'
        if (pos == 'after') 'before'
    }


    if (nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_CONTAINS) {

        let child = nodeB;

        while (child.parentNode != nodeA) child = child.parentNode

        if (getNodeIndex(child) < offsetA) return 'after';
    }

    return 'before';
}

// 获得最远的祖先节点
export function getFurthestAncestor(node) {
    let root = node
    while (root.parentNode) {
        root = root.parentNode;
    }
    return root;
}

// 被包含定义为在开始节点之后，在结束节点之前，就认为被包含
export function isContained(node, range) {
    const startPosition = getPosition(node, 0, range.startContainer, range.startOffset);
    const endPosition = getPosition(node, getNodeLength(node), range.endContainer, range.endOffset);

    return getFurthestAncestor(node) == getFurthestAncestor(range.startContainer)
        && startPosition == 'after'
        && endPosition == 'before';
}

// 是否有效被包含
export function isEffectivelyContained(node, range) {
    if (range.collapsed) return false;

    if (isContained(node, range)) return true;

    if (node == range.startContainer
    && node.nodeType == Node.TEXT_NODE
    && getNodeLength(node) != range.startOffset) {
        return true;
    }

    if (node == range.endContainer
    && node.nodeType == Node.TEXT_NODE
    && range.endOffset != 0) {
        return true;
    }

    if (node.hasChildNodes()
    && [].every.call(node.childNodes, (child) => isEffectivelyContained(child, range))
    && (!isDescendant(range.startContainer, node)
        || range.startContainer.nodeType != Node.TEXT_NODE
        || range.startOffset == 0)
    && (!isDescendant(range.endContainer, node)
        || range.endContainer.nodeType != Node.TEXT_NODE
        || range.endOffset == getNodeLength(range.endContainer)
        )
    ) {
        return true;
    }

    return false;
}

// 获得所有被包含的节点
export function getAllEffectivelyContainedNodes(range, condition) {
    if (typeof condition == 'undefined') {
        condition = function() { return true };
    }

    // 获得开始节点的最顶层被包裹在选区范围内的节点
    let node = range.startContainer;
    while (isEffectivelyContained(node.parentNode, range)) {
        node = node.parentNode;
    }

    // 获得选区结束的下个节点
    let stop = nextNodeDescendants(range.endContainer);

    // 开始对节点进行读取，进行树深度前序遍历得到选中的 list
    const nodeList = [];
    while (isBefore(node, stop)) {
        // 判断是否当前节点被有效包含，因为会存在范围溢出的情况
        // condition 对当前节点进行判断，默认会选中所有节点
        if (isEffectivelyContained(node, range)
        && condition(node)) {
            nodeList.push(node);
        }
        node = nextNode(node);
    }
    return nodeList;
}


export function isContainedNode(node, otherNode) {
    return node.contains(otherNode)
}