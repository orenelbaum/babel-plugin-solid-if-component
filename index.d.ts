import { JSX, Show } from 'solid-js'


export declare const If: <T>(props: {
   cond: T | undefined | null | false;
   fallback?: JSX.Element;
   children: JSX.Element | ((item: NonNullable<T>) => JSX.Element);
}) => (() => JSX.Element)

export declare const Else:(
   props: { children: JSX.Element; }
) => (() => JSX.Element)
