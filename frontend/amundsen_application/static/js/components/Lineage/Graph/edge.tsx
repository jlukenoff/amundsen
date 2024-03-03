import { curveMonotoneX } from '@visx/curve';
import { GraphEdge } from '@dagrejs/dagre';
import React from 'react';
import { LinePath } from '@visx/shape';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretRight } from '@fortawesome/free-solid-svg-icons/faCaretRight';

type EdgeProps = {
  edgePoints: GraphEdge[];
};

type EdgePoint = {
  isSelected: boolean;
  points: {
    x: number;
    y: number;
  }[];
};

const ICON_SIZE = 16;

const Edge: React.FC<EdgeProps> = ({ edgePoints }) => {
  const getPoints = (edge: EdgePoint) => edge.points[edge.points.length - 1];

  const edgeEnds = edgePoints.map((edge) => {
    const isSelected = edgePoints.find(
      (o) =>
        getPoints(o as EdgePoint).x === getPoints(edge as EdgePoint).x &&
        getPoints(o as EdgePoint).y === getPoints(edge as EdgePoint).y &&
        o.isSelected === true
    );

    return {
      ...edge.points[edge.points.length - 1],
      ...{ isSelected: typeof isSelected !== 'undefined' },
    };
  });

  return (
    <>
      {edgePoints.map((edge, i) => (
        <LinePath<{ x: number; y: number }>
          key={i}
          curve={curveMonotoneX}
          data={edge.points}
          x={(d) => d.x}
          y={(d) => d.y}
          stroke="#ccc"
          strokeWidth={1}
          opacity={1}
          shapeRendering="geometricPrecision"
        />
      ))}
      {edgeEnds.map((edge, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faCaretRight}
          x={edge.x - ICON_SIZE / 2}
          y={edge.y - ICON_SIZE / 2}
          width={ICON_SIZE}
          height={ICON_SIZE}
          color="#ccc"
        />
      ))}
    </>
  );
};

export default Edge;
