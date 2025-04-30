import {useEffect, useState} from 'react'
import {TextStyle, View} from 'react-native'
import {Image as SvgImage, Svg} from 'react-native-svg'
import {$Typed, AppBskyRichtextFacet} from '@atproto/api'
import {SelfLabels} from '@atproto/api/dist/client/types/com/atproto/label/defs'
import LottieView from 'lottie-react-native'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {useAgent} from '#/state/session'
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

interface BluemojiRecord {
  $type?: 'blue.moji.collection.item'
  name: string
  alt: string
  createdAt: string
  formats: {
    $type?: 'blue.moji.collection.item#formats_v0'
    lottie?: Uint8Array
    apng?: Uint8Array
    // Plus other formats that don't matter for our purposes
  }
}

export function containsBluemoji(facet: ExtendedFacet) {
  if (!facet) return false
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

function toImageUri(pds: string, did: string, cid: string) {
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`
}

function BluemojiStaticInner({
  style,
  emoji,
}: {
  emoji: BluemojiFeature
  style: TextStyle
}) {
  const [emojiUri, setEmojiUri] = useState<string>()

  useEffect(() => {
    async function fetchEmojiUri() {
      const pds = await resolvePdsServiceUrl(emoji.did as `did:${string}`)

      let uri
      // Render in this order
      if (emoji.formats.png_128) {
        uri = toImageUri(pds, emoji.did, emoji.formats.png_128)
      } else if (emoji.formats.webp_128) {
        uri = toImageUri(pds, emoji.did, emoji.formats.webp_128)
      } else if (emoji.formats.gif_128) {
        // GIFs in this case are NOT animated
        uri = toImageUri(pds, emoji.did, emoji.formats.gif_128)
      }

      setEmojiUri(uri)
      console.log(uri)
    }

    fetchEmojiUri()
  }, [emoji])

  return (
    <BluemojiHoverCard
      name={emoji.name}
      uri={emojiUri!}
      description={emoji.alt}>
      {renderStaticImage(style, emoji.name, emoji.alt, emojiUri!)}
    </BluemojiHoverCard>
  )
}

// https://stackoverflow.com/a/66046176/16255372
async function bufferToBase64(buffer: Uint8Array) {
  // use a FileReader to generate a base64 data URI:
  const base64url = await new Promise<string>(r => {
    const reader = new FileReader()
    reader.onload = () => r(reader.result as string)
    reader.readAsDataURL(new Blob([buffer]))
  })
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(',') + 1)
}

function BluemojiLottieInner({
  style,
  emoji,
}: {
  emoji: BluemojiFeature
  style: TextStyle
}) {
  const agent = useAgent()
  const [emojiSource, setEmojiSource] = useState<string>()

  useEffect(() => {
    async function fetchEmojiSource() {
      const emojiRecord = await agent.com.atproto.repo.getRecord({
        repo: emoji.did,
        collection: 'blue.moji.collection.item',
        rkey: emoji.name.slice(1, -1),
      })

      console.log(emojiRecord)
      const bytes = (emojiRecord.data.value as any as BluemojiRecord).formats
        .lottie!
      // https://stackoverflow.com/questions/13950865/javascript-render-png-stored-as-uint8array-onto-canvas-element-without-data-uri
      const source =
        'data:video/lottie+json;base64,' +
        encodeURIComponent(await bufferToBase64(bytes))

      setEmojiSource(source)
    }

    fetchEmojiSource()
  }, [emoji, agent])

  return (
    <BluemojiHoverCard
      name={emoji.name}
      uri={emojiSource!}
      description={emoji.alt}>
      <View
        style={{
          width: ((style.fontSize ?? 16) * 23.5) / 20,
          height: ((style.fontSize ?? 16) * 23.5) / 20,
          transform: `translateY(${((style.fontSize ?? 16) * 5) / 20}px)`,
        }}>
        {emojiSource && <LottieView source={emojiSource} autoPlay loop />}
      </View>
    </BluemojiHoverCard>
  )
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

  // Note: For some reason, ALL emojis get a lottie field, valid or otherwise
  // for pngs and webps etc., this is just set to a base64 encoded version of the png
  // So, to check if an emoji is truly in lottie format, we have to check if it NOT a png/webp
  // which is just as simple as checking for if any of those fields are set

  // Render static image
  if (
    emoji.formats.png_128 ||
    emoji.formats.webp_128 ||
    emoji.formats.gif_128
  ) {
    return <BluemojiStaticInner style={style} emoji={emoji} />
  } else if (emoji.formats.lottie) {
    return <BluemojiLottieInner style={style} emoji={emoji} />
  } else {
    return <></>
  }
}
