import {expectType} from 'tsd';
import pWaitFor, {resolveWith} from './index.js';

expectType<Promise<void>>(pWaitFor(() => false));
expectType<Promise<void>>(pWaitFor(async () => false));
expectType<Promise<void>>(pWaitFor(() => true, {interval: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {timeout: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {before: false}));
expectType<Promise<number>>(pWaitFor(() => resolveWith(1)));
expectType<Promise<number>>(pWaitFor(() => resolveWith(1)));
