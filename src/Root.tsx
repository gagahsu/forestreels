import React from 'react';
import { Composition } from 'remotion';
import { StoryReel, StoryProps, timeline } from './Reel';
import { T } from './theme';
import sample from '../data/sample_ep01.json';

export const Root: React.FC = () => (
  <Composition
    id="StoryReel"
    component={StoryReel as any}
    width={T.W} height={T.H} fps={T.FPS}
    durationInFrames={300}
    defaultProps={sample as StoryProps}
    calculateMetadata={({ props }) => ({ durationInFrames: timeline(props as StoryProps).total })}
  />
);
