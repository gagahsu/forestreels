import React from 'react';
import { Composition } from 'remotion';
import { StoryReel, StoryProps, timeline, ReelCover } from './Reel';
import { IntroCard, IntroProps, INTRO_W, INTRO_H } from './IntroCards';
import { T } from './theme';
import { PostCard, PostProps, POST_W, POST_H, ColoringPrint, PrintProps, PRINT_W, PRINT_H } from './PostCards';
import sample from '../data/sample_ep01.json';
import samplePost from '../data/posts/sample_vocab.json';

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
      id="ReelCover"
      component={ReelCover as any}
      width={T.W} height={T.H} fps={T.FPS}
      durationInFrames={1}
      defaultProps={sample as StoryProps}
    />
    <Composition
      id="IntroCard"
      component={IntroCard as any}
      width={INTRO_W} height={INTRO_H} fps={T.FPS}
      durationInFrames={1}
      defaultProps={{ page: 1 } as IntroProps}
    />
    <Composition
      id="PostCard"
      component={PostCard as any}
      width={POST_W} height={POST_H} fps={T.FPS}
      durationInFrames={1}
      defaultProps={{ post: samplePost, page: 1 } as PostProps}
    />
    <Composition
      id="ColoringPrint"
      component={ColoringPrint as any}
      width={PRINT_W} height={PRINT_H} fps={T.FPS}
      durationInFrames={1}
      defaultProps={{ p: { no: 1, question: '為什麼月亮會跟著我走？', image: 'coloring/ep01_moon.png' } } as PrintProps}
    />
  </>
);
