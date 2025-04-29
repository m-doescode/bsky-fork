import {TextStyle} from 'react-native'
import {Image as SvgImage, Svg} from 'react-native-svg'
import {$Typed, AppBskyRichtextFacet} from '@atproto/api'
import {SelfLabels} from '@atproto/api/dist/client/types/com/atproto/label/defs'

import {BluemojiHoverCard} from './BluemojiHoverCard'

interface BluemojiFormats {
  $type?: 'blue.moji.richtext.facet#formats_v0'
  png_128?: string // cid
  webp_128?: string // cid
  gif_128?: string // cid
  apng_128?: boolean
  lottie?: boolean
}

interface LegacyBluemojiFeature {
  $type?: 'blue.moji.richtext.facet#bluemoji'
  uri: string
  name: string
  alt: string
}

interface BluemojiFeature {
  $type?: 'blue.moji.richtext.facet'
  name: string
  alt: string
  did: string
  adultOnly?: boolean
  labels: SelfLabels
  formats: BluemojiFormats
}

export type ExtendedFacet =
  | AppBskyRichtextFacet.Main
  | {
      $type: 'app.bsky.richtext.facet' | 'blue.moji.richtext.facet' // Legacy facet, should be app.bsky.richtext.facet
      features: ($Typed<LegacyBluemojiFeature> | $Typed<BluemojiFeature>)[]
    }

export function containsBluemoji(facet: ExtendedFacet) {
  if (facet === null) return false
  const isLegacy = facet.$type === 'blue.moji.richtext.facet'
  // Not sure if more than one feature can be assigned to a single facet in this case. I don't think so, at any rate
  // TODO: Yes it is possible, if say the bluemoji becomes linked. Fix this before merging
  if (facet.features.length !== 1) return false
  const feat = facet.features[0]

  if (
    isLegacy
      ? feat.$type === 'blue.moji.richtext.facet#bluemoji'
      : feat.$type === 'blue.moji.richtext.facet'
  ) {
    return true
  }

  return false
}

function renderStaticImage(
  style: TextStyle,
  name: string,
  alt: string,
  uri: string,
) {
  // Abusing an SVG in this way is not in any way ideal, but
  // AFAIK, <Image> doesn't let you inline it. So this will have to suffice
  return (
    <Svg
      viewBox="0 0 14 14"
      style={{userSelect: 'text', cursor: 'auto'}}
      width={((style.fontSize ?? 16) * 23.5) / 20}
      height={((style.fontSize ?? 16) * 23.5) / 20}
      translateY={((style.fontSize ?? 16) * 5) / 20}
      title={name}
      accessible
      accessibilityLabel={name}
      accessibilityHint={alt}>
      <SvgImage href={uri} width="14" height="14" />
    </Svg>
  )
}

function toImageUri(did: string, cid: string) {
  return `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`
}

export function BluemojiEmoji({
  facet,
  style,
}: {
  style: TextStyle
  facet: ExtendedFacet
}) {
  if (facet.features.length !== 1) return <></>

  // Handle case of legacy bluemoji
  if (facet.$type === 'blue.moji.richtext.facet') {
    const feat = facet.features[0]
    if (feat.$type !== 'blue.moji.richtext.facet#bluemoji') return <></>

    return (
      <BluemojiHoverCard name={feat.name} uri={feat.uri} description={feat.alt}>
        {renderStaticImage(style, feat.name, feat.alt, feat.uri)}
      </BluemojiHoverCard>
    )
  }

  // Add emoji
  const feat = facet.features[0]
  if (feat.$type !== 'blue.moji.richtext.facet') return <></>
  const emoji: BluemojiFeature = feat as BluemojiFeature

  // Try to render in this order
  if (emoji.formats.png_128) {
    const uri = toImageUri(emoji.did, emoji.formats.png_128)

    return (
      <BluemojiHoverCard name={emoji.name} uri={uri} description={emoji.alt}>
        {renderStaticImage(style, emoji.name, emoji.alt, uri)}
      </BluemojiHoverCard>
    )
  }
}
