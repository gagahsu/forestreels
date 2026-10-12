import React from 'react';
import { Composition } from 'remotion';
import { StoryReel, StoryProps, timeline } from './Reel';
import { IntroCard, IntroProps, INTRO_W, INTRO_H } from './IntroCards';
import { T } from './theme';
import sample from '../data/sample_ep01.json';

export const Root: React.FC = () => (
  <>
    <Composition
      id="StoryReel"
      component={StoryReel as any}
      width={T.W} height={T.H} fps={T.FPS}
      durationInFrames={300}
      defaultProps={sample as StoryProps}
      calculateMetadata={({ props }) => ({ durationInFrames: timeline(props as StoryProps).total })}
    />
    <Composition
      id="IntroCard"
      component={IntroCard as any}
      width={INTRO_W} height={INTRO_H} fps={T.FPS}
      durationInFrames={1}
      defaultProps={{ page: 1 } as IntroProps}
    />
  </>
);
