import {useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a,useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  Star_Filled_Corner0_Rounded as FavoriteFilled,
  Star_Stroke2_Corner0_Rounded as FavoriteOutline,
} from '#/components/icons/Star'
import {useDialogControl} from '../Dialog'
import {Text} from '../Typography'
import {type BluemojiHoverCardProps} from './types'

// Actual hover card in index.web.tsx

export function BluemojiHoverCard(props: BluemojiHoverCardProps) {
  const infoDialogControl = useDialogControl()

  return (
    <>
      <Button
        onPress={() => infoDialogControl.open()}
        label={props.description}>
        {props.children}
      </Button>
      <MyDialog
        control={infoDialogControl}
        name={props.name}
        uri={props.uri}
        description={props.description}
      />
    </>
  )
}

function MyDialog({
  control,
  name,
  uri,
  description,
}: {
  control: Dialog.DialogControlProps
  name: string
  uri: string
  description: string
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`About Bluemoji`)}
        style={[{width: 'auto', maxWidth: 400, minWidth: 200}]}>
        <Inner
          name={name}
          uri={uri}
          description={description}
          hide={() => {}}
        />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({
  name,
  description,
}: {
  name: string
  uri: string
  description: string
  hide: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [isFavorited, setFavorited] = useState<Boolean>()

  const onPress = () => {
    setFavorited(!isFavorited)
  }

  return (
    <View style={[a.flex_col, a.justify_between]}>
      <View style={[a.flex_row, a.justify_between, a.align_start, a.pb_sm]}>
        <View style={[a.flex_col, a.align_start]}>
          <Text style={[a.font_bold, a.text_xl]}>{name}</Text>
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.flex_wrap,
              t.atoms.text_contrast_medium,
            ]}>
            Bluemoji
          </Text>
        </View>

        <Button
          style={[a.flex_row, a.align_center, a.gap_xs, a.pt_2xs]}
          onPress={onPress}
          label={isFavorited ? _(msg`Favorited`) : _(msg`Add to favorites`)}>
          {isFavorited ? <FavoriteFilled /> : <FavoriteOutline />}
          <Text
            style={[a.text_sm, a.leading_snug, {color: t.palette.primary_500}]}>
            {isFavorited ? _(msg`Favorited`) : _(msg`Add to favorites`)}
          </Text>
        </Button>
      </View>
      <Text style={[a.text_md]}>{description}</Text>
    </View>
  )
}
