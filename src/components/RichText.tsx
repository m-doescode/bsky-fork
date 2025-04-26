import React from 'react'
import {TextStyle} from 'react-native'
import {$Typed, AppBskyRichtextFacet, RichText as RichTextAPI} from '@atproto/api'

import {toShortUrl} from '#/lib/strings/url-helpers'
import {atoms as a, flatten, TextStyleProp} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {InlineLinkText, LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichTextTag} from '#/components/RichTextTag'
import {Text, TextProps} from '#/components/Typography'
import {Svg, Image as SvgImage} from 'react-native-svg'

const WORD_WRAP = {wordWrap: 1}

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: TextStyle
    emojiMultiplier?: number
    shouldProxyLinks?: boolean
  }

// deer
interface BluemojiFeature {
  $type?: 'blue.moji.richtext.facet#bluemoji'
  uri: string
  name: string
  alt: string
};

type ExtendedFacet = AppBskyRichtextFacet.Main | {
  $type: 'blue.moji.richtext.facet'
  features: $Typed<BluemojiFeature>[]
};

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
  onLayout,
  onTextLayout,
  shouldProxyLinks,
}: RichTextProps) {
  const richText = React.useMemo(
    () =>
      value instanceof RichTextAPI ? value : new RichTextAPI({text: value}),
    [value],
  )

  const flattenedStyle = flatten(style)
  const plainStyles = [a.leading_snug, flattenedStyle]
  const interactiveStyles = [
    a.leading_snug,
    flatten(interactiveStyle),
    flattenedStyle,
  ]

  const {text, facets} = richText

  if (!facets?.length) {
    if (isOnlyEmoji(text)) {
      const fontSize =
        (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={[plainStyles, {fontSize}]}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        emoji
        selectable={selectable}
        testID={testID}
        style={plainStyles}
        numberOfLines={numberOfLines}
        onLayout={onLayout}
        onTextLayout={onTextLayout}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }

  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    const tag = segment.tag
    if (
      mention &&
      AppBskyRichtextFacet.validateMention(mention).success &&
      !disableLinks
    ) {
      els.push(
        <ProfileHoverCard key={key} inline did={mention.did}>
          <InlineLinkText
            selectable={selectable}
            to={`/profile/${mention.did}`}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}>
            {segment.text}
          </InlineLinkText>
        </ProfileHoverCard>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      if (disableLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <InlineLinkText
            selectable={selectable}
            key={key}
            to={link.uri}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shareOnLongPress
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}
            emoji>
            {toShortUrl(segment.text)}
          </InlineLinkText>,
        )
      }
    } else if (
      !disableLinks &&
      enableTags &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <RichTextTag
          key={key}
          display={segment.text}
          tag={tag.tag}
          textStyle={interactiveStyles}
          authorHandle={authorHandle}
        />,
      )
    } else if ((segment.facet as ExtendedFacet)?.$type == "blue.moji.richtext.facet") {
      const facet: ExtendedFacet = segment.facet as ExtendedFacet

      // Add each emoji
      for (const feat of facet.features) {
        if (feat.$type != 'blue.moji.richtext.facet#bluemoji') continue
        const emoji: BluemojiFeature = feat as BluemojiFeature
        els.push(
          // Abusing an SVG in this way is not in any way ideal, but
          // AFAIK, <Image> doesn't let you inline it. So this will have to suffice
          <Svg
            key={key}
            viewBox="0 0 24 24"
            style={{marginBottom: -6, userSelect: 'text', cursor: 'auto'}}
            width="24"
            height="24"
            title={emoji.name}
            accessible
            accessibilityLabel={emoji.name + " " + emoji.alt}>
              <SvgImage href={emoji.uri} width="24" height="24" />
          </Svg>
        );
      }
    } else {
      els.push(segment.text)
    }
    key++
  }

  return (
    <Text
      emoji
      selectable={selectable}
      testID={testID}
      style={plainStyles}
      numberOfLines={numberOfLines}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}
