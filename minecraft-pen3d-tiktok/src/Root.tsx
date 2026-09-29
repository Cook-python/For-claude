import {Composition} from 'remotion';
import {MinecraftPen3D} from './MinecraftPen3D';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MinecraftPen3D"
    component={MinecraftPen3D}
    durationInFrames={450}
    fps={30}
    width={1080}
    height={1920}
  />
);
