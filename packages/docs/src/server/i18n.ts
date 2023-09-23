import { I18nInstance } from 'simple-i18n';
import ICUFormatter from 'simple-i18n/src/formatter/ICUFormatter';
import JsonParser from 'simple-i18n/src/parser/JsonParser';
import NodeFsLoader from 'simple-i18n/src/loader/NodeFsLoader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const i18n = new I18nInstance<any>({
	fallbackLocale: 'en',
	locales: ['en', 'ru'],
	formatter: new ICUFormatter(),
	parser: new JsonParser(),
	loader: new NodeFsLoader({
		template: '/locale/{lng}/{ns}.json'
	})
});

export default i18n;
