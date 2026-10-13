/**
 * Remotion settings for the launch video. H.264 at a quality that keeps the
 * 52s film well under the 20 MB the brief allows; render.mjs checks the size.
 */
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
