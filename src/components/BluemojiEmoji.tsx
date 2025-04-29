import {type TextStyle, View} from 'react-native'
import {Image as SvgImage, Svg} from 'react-native-svg'
import {type $Typed, type AppBskyRichtextFacet} from '@atproto/api'

import {BluemojiHoverCard} from './BluemojiHoverCard'

interface BluemojiFeature {
  $type?: 'blue.moji.richtext.facet#bluemoji'
  uri: string
  name: string
  alt: string
}

export type ExtendedFacet =
  | AppBskyRichtextFacet.Main
  | {
      $type: 'blue.moji.richtext.facet'
      features: $Typed<BluemojiFeature>[]
    }

export function BluemojiEmoji({
  facet,
  style,
}: {
  style: TextStyle
  facet: ExtendedFacet
}) {
  const els = []

  // Add each emoji
  for (const feat of facet.features) {
    if (feat.$type !== 'blue.moji.richtext.facet#bluemoji') continue
    const emoji: BluemojiFeature = feat as BluemojiFeature
    els.push(
      // Abusing an SVG in this way is not in any way ideal, but
      // AFAIK, <Image> doesn't let you inline it. So this will have to suffice
      <BluemojiHoverCard
        name={emoji.name}
        uri={emoji.uri}
        description={emoji.alt}>
        <Svg
          viewBox="0 0 14 14"
          style={{userSelect: 'text', cursor: 'auto'}}
          width={((style.fontSize ?? 16) * 23.5) / 20}
          height={((style.fontSize ?? 16) * 23.5) / 20}
          translateY={((style.fontSize ?? 16) * 5) / 20}
          title={emoji.name}
          accessible
          accessibilityLabel={emoji.name}
          accessibilityHint={emoji.alt}>
          <SvgImage href={emoji.uri} width="14" height="14" />
        </Svg>
      </BluemojiHoverCard>,
    )
  }

  return <View>{els}</View>
}
