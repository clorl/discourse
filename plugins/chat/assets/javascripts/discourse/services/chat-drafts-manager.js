import { cancel } from "@ember/runloop";
import Service, { service } from "@ember/service";

export default class ChatDraftsManager extends Service {
  @service chatApi;

  drafts = {};

  willDestroy() {
    super.willDestroy(...arguments);
    cancel(this._persistHandler);
  }

  async add(message, channelId, threadId, persist = true) {
    try {
      this.drafts[this.key(channelId, threadId)] = message;

      if (persist) {
        await this.persistDraft(message, channelId, threadId);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Couldn't save draft", e);
    }
  }

  get(channelId, threadId) {
    return this.drafts[this.key(channelId, threadId)];
  }

  remove(channelId, threadId) {
    delete this.drafts[this.key(channelId, threadId)];
  }

  reset() {
    this.drafts = {};
  }

  key(channelId, threadId) {
    let key = `c-${channelId}`;
    if (threadId) {
      key += `:t-${threadId}`;
    }
    return key.toString();
  }

  async persistDraft(message, channelId, threadId) {
    try {
      await this.chatApi.saveDraft(channelId, message.toJSONDraft(), {
        threadId,
      });
      message.draftSaved = true;
    } catch {
      // We don't want to throw an error if the draft fails to save
    }
  }
}
