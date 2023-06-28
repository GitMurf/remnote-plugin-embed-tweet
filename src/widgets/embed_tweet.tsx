import {
  AppEvents,
  WidgetLocation,
  renderWidget,
  useAPIEventListener,
  usePlugin,
  useRunAsync,
} from '@remnote/plugin-sdk';
import { debounce } from 'debounce';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { extractTweetId } from '../utils';

import { Tweet } from 'react-twitter-widgets';
import { THEME, usePreferTheme } from '../hooks/usePreferTheme';

const EMBED_TWEET_WIDGET = 'embed_tweet_widget';

export const EmbedTweetWidget = () => {
  const plugin = usePlugin();
  const [id] = useState(nanoid());
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [tweetId, setTweetId] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);

  const theme = usePreferTheme();

  const widgetContext = useRunAsync(
    () => plugin.widget.getWidgetContext<WidgetLocation.UnderRemEditor>(),
    []
  );

  const getRemText = async (remId: string) => {
    const rem = await plugin.rem.findOne(remId);
    const text = await plugin.richText.toString(rem?.text || []);
    return text?.toString() || '';
  };

  const getTweetId = async () => {
    const remId = widgetContext?.remId;
    const text = remId && (await getRemText(remId));
    const tweetId = extractTweetId(text ?? '');
    setTweetId(tweetId);
  };

  useAPIEventListener(
    AppEvents.RemChanged,
    widgetContext?.remId,
    debounce(() => getTweetId(), 500)
  );

  useEffect(() => {
    if (widgetContext?.remId && widgetRef.current) {
      getTweetId();
    }
  }, [widgetContext?.remId, widgetRef.current]);

  return (
    <div>
      <div ref={widgetRef} id={EMBED_TWEET_WIDGET + id} />
      {loading && <div>Loading...</div>}
      {tweetId ? (
        <Tweet
          tweetId={tweetId}
          options={{ theme: theme === THEME.light ? 'light' : 'dark', cards: 'hidden' }}
          onLoad={() => {
            setLoading(false);
          }}
          renderError={(error) => {
            console.error('Tweet render error', error);
            return 'Could not load tweet! ';
          }}
        />
      ) : (
        `no valid tweet Id: ${tweetId}`
      )}
    </div>
  );
};

renderWidget(EmbedTweetWidget);