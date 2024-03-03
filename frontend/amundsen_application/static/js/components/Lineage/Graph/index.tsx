// Copyright Contributors to the Amundsen project.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { Lineage, LineageItem, ResourceType } from 'interfaces';
import { CHART_DEFAULT_DIMENSIONS, LINEAGE_SCENE_MARGIN } from './constants';
import dagre, { GraphEdge } from '@dagrejs/dagre';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { Zoom } from '@visx/zoom';
import './styles.scss';
import { getSourceIconClass } from 'config/config-utils';
import Edge from './edge';

const NODE_WIDTH = 300;
const NODE_HEIGHT = 50;

export const DAGRE_CONFIG = {
  rankdir: 'LR',
  marginx: 140,
  marginy: 40,
  align: 'UL',
  ranker: 'network-simplex',
  edgesep: 60,
  ranksep: 140,
};

export const INITIAL_TRANSFORM = {
  scaleX: 0.8,
  scaleY: 0.8,
  translateX: 0,
  translateY: 0,
  skewX: 0,
  skewY: 0,
};

interface LineageNode {
  targetPosition: string;
  sourcePosition: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  data: LineageItem;
  label: string;
}

function initializeDagreGraph() {
  const dagreGraph = new dagre.graphlib.Graph<LineageNode>({ directed: true });

  dagreGraph.setGraph(DAGRE_CONFIG);
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  return dagreGraph;
}

function initializeGraphContents(
  lineage: Lineage,
  graph: dagre.graphlib.Graph<LineageNode>
) {
  const allEntities = [
    ...lineage.upstream_entities,
    ...lineage.downstream_entities,
  ];

  allEntities.forEach((entity) => {
    graph.setNode(entity.key, {
      data: entity,
      label: entity.key,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      targetPosition: 'left',
      sourcePosition: 'right',
    });
  });

  allEntities.forEach((entity) => {
    if (entity.parent) {
      graph.setEdge(entity.parent, entity.key);
    }
  });

  dagre.layout(graph);

  graph.nodes().forEach((nodeId) => {
    const node = graph.node(nodeId);

    node.position = {
      x: node.x - NODE_WIDTH / 2,
      y: node.y - NODE_HEIGHT / 2,
    };
  });
}

export interface GraphProps {
  lineage: Lineage;
  rootNode: LineageItem;
}

export const getDimensions = ({ width, height }: DOMRect) => ({
  width:
    (width || CHART_DEFAULT_DIMENSIONS.width) -
    (LINEAGE_SCENE_MARGIN.left + LINEAGE_SCENE_MARGIN.right),
  height:
    (height || CHART_DEFAULT_DIMENSIONS.height) -
    (LINEAGE_SCENE_MARGIN.top + LINEAGE_SCENE_MARGIN.bottom),
});

function getGraphEdges(graph: dagre.graphlib.Graph<LineageNode> | null) {
  return graph?.edges().map((e) => graph.edge(e));
}

export const Graph: React.FC<GraphProps> = ({
  lineage,
  rootNode,
}: GraphProps) => {
  const graph = React.useRef(initializeDagreGraph());
  const [lineageState, setLineageState] = React.useState<{
    nodes: string[];
    edges: GraphEdge[];
  } | null>(null);

  React.useEffect(() => {
    if (!lineageState) {
      initializeGraphContents(lineage, graph.current);
      setLineageState({
        nodes: graph.current.nodes(),
        edges: getGraphEdges(graph.current) || [],
      });
    }

    return () => {
      graph.current = initializeDagreGraph();
    };
  }, [lineage, graph.current, lineageState]);

  if (!lineageState || !graph.current) {
    return <span>Please wait...</span>;
  }

  return (
    <ParentSize>
      {(parent) => (
        <Zoom
          width={parent.width}
          height={parent.height}
          initialTransformMatrix={INITIAL_TRANSFORM}
        >
          {(zoom) => (
            <div>
              <svg
                style={{
                  width: '100vw',
                  height: '100vh',
                  cursor: zoom.isDragging ? 'grabbing' : 'grab',
                }}
                ref={zoom.containerRef as React.LegacyRef<SVGSVGElement>}
              >
                <g transform={zoom.toString()}>
                  <Edge edgePoints={lineageState.edges} />
                </g>
                <g transform={zoom.toString()}>
                  {graph.current.nodes().map((n) => {
                    const node = graph.current.node(n);
                    const isRoot = n === rootNode.key;

                    return (
                      <React.Fragment key={node.data.key}>
                        <g>
                          <foreignObject
                            x={node.x - NODE_WIDTH / 2}
                            y={node.y - NODE_HEIGHT / 2}
                            fill="white"
                            width={NODE_WIDTH}
                            height={NODE_HEIGHT}
                          >
                            <div
                              style={{
                                display: 'flex',
                                height: 'calc(100% - 5px)',
                                width: 'calc(100% - 5px)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${
                                  isRoot ? 'black' : '#ccc'
                                }`,
                                margin: 'auto',
                                borderRadius: '4px',
                                boxShadow: isRoot ? '0 0 10px 0 #ccc' : 'none',
                              }}
                            >
                              <span
                                className={
                                  'icon icon-header ' +
                                  getSourceIconClass(
                                    node.data.database,
                                    ResourceType.table
                                  )
                                }
                                style={{ margin: '0 0 0 0.5rem' }}
                              />
                              <span
                                style={{
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  padding: '0 0.5rem',
                                }}
                              >
                                {node.label}
                              </span>
                            </div>
                          </foreignObject>
                        </g>
                      </React.Fragment>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}
        </Zoom>
      )}
    </ParentSize>
  );
};

export default Graph;
