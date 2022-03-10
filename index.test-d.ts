import {expectType} from 'tsd';
import pWaitFor from './index.js';

expectType<Promise<void>>(pWaitFor(() => false));
expectType<Promise<void>>(pWaitFor(async () => false));
expectType<Promise<void>>(pWaitFor(() => true, {interval: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {timeout: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {before: false}));

expectType<Promise<void>>(pWaitFor(resolve => resolve()));
expectType<Promise<void>>(pWaitFor(async resolve => resolve()));
expectType<Promise<string>>(pWaitFor<string>(resolve => resolve('foo')));
expectType<Promise<string>>(pWaitFor<string>(async resolve => resolve('foo')));
