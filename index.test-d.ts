import {expectType} from 'tsd-check';
import pWaitFor from '.';

expectType<Promise<void>>(pWaitFor(() => false));
expectType<Promise<void>>(pWaitFor(() => Promise.resolve(false)));
expectType<Promise<void>>(pWaitFor(() => true, {interval: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {timeout: 1}));
