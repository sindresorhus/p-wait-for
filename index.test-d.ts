import {expectType} from 'tsd';
import pWaitFor from './index.js';

expectType<Promise<void>>(pWaitFor(() => false));
expectType<Promise<void>>(pWaitFor(async () => false));
expectType<Promise<void>>(pWaitFor(() => true, {interval: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {timeout: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {before: false}));

expectType<Promise<number>>(pWaitFor(() => [true, 42]));
expectType<Promise<number>>(pWaitFor(async () => [false, 42]));
