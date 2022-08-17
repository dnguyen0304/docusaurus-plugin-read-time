interface LocalStoragePullType {
    url: string;
    title: string;
}

// See https://github.com/facebook/docusaurus/blob/01ac2e0fcaccaf469992f93a0e8bf04e61cf850e/packages/docusaurus-utils/src/pathUtils.ts#L93
const DOCUSAURUS_ALIASED_SITE_PATH_PREFIX: string = '@site';

// TODO(dnguyen0304): Extract as a configuration option.
const ENDPOINT_EXCHANGE_CODE_TO_TOKEN: string = 'https://z39iitznuj.execute-api.us-west-1.amazonaws.com/production/DocusaurusThemeEditor_getAccessToken';

// Keep in sync:
// GitHub > Developer Settings > OAuth Apps > "Authorization callback URL"
const GITHUB_AUTHORIZATION_CALLBACK_PATH: string = '/editor/callback';

const SEARCH_PARAM_KEY_IS_LOGGED_IN: string = 'is_logged_in';
const COOKIE_KEY_SESSION_ID: string = 'session_id';
const LOCAL_STORAGE_KEY_PULL: string = 'pull';
const LOCAL_STORAGE_KEY_PULL_TITLE: string = 'pull_title';
const LOCAL_STORAGE_KEY_PULL_URL: string = 'pull_url';

export {
    LocalStoragePullType,
    COOKIE_KEY_SESSION_ID,
    DOCUSAURUS_ALIASED_SITE_PATH_PREFIX,
    ENDPOINT_EXCHANGE_CODE_TO_TOKEN,
    GITHUB_AUTHORIZATION_CALLBACK_PATH,
    LOCAL_STORAGE_KEY_PULL,
    LOCAL_STORAGE_KEY_PULL_TITLE,
    LOCAL_STORAGE_KEY_PULL_URL,
    SEARCH_PARAM_KEY_IS_LOGGED_IN,
};
