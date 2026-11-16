import { Fragment } from 'react';
import { NavLink, useParams } from 'react-router';
import { FORUMS, isForum } from './forums.js';
import { useForumMessages } from './useForumMessages.js';
import { MessageForm } from './MessageForm.jsx';
import './Forum.css';

const timeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default function ForumPage() {
  const { forumId } = useParams();

  return (
    <main className="forum-frame">
      <nav className="channel-switcher" aria-label="Kênh">
        {FORUMS.map((forum) => (
          <NavLink
            key={forum}
            to={`/forum/${forum}`}
            className={({ isActive }) => (isActive ? 'active-link' : 'link')}
          >
            {forum}
          </NavLink>
        ))}
      </nav>
      {/* Only a known channel mounts the hook, so an unknown URL never hits the API. */}
      {isForum(forumId) ? (
        <Channel forumId={forumId} />
      ) : (
        <div role="alert">404: Kênh không tồn tại</div>
      )}
    </main>
  );
}

function Channel({ forumId }) {
  const { data, loading, error, postMessage } = useForumMessages(forumId);

  return (
    <div className="channel">
      <h2>#{forumId}</h2>
      <section className="messages" aria-label={`Tin nhắn kênh ${forumId}`} aria-busy={loading}>
        {loading && <p role="status">Đang tải…</p>}
        {error && <p role="alert">Không tải được tin nhắn: {error}</p>}
        {!loading && !error && data.length === 0 && <p>Chưa có tin nhắn nào.</p>}
        {data.length > 0 && (
          <dl className="message-list">
            {data.map((msg) => (
              <Fragment key={msg.id}>
                <dt>
                  <span className="author">{msg.author}</span>{' '}
                  <time dateTime={msg.timestamp}>{timeFormat.format(new Date(msg.timestamp))}</time>
                </dt>
                <dd>{msg.text}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>
      <MessageForm onSubmit={postMessage} />
    </div>
  );
}
