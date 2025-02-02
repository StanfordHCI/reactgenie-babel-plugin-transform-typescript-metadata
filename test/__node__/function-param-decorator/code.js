import Based from 'based';
import DecoFn from 'decorator';
import { Some } from 'some';
import { Args, Context } from '@nestjs/graphql';
import { Xyz } from 'xyz';

class SomeClass {
  constructor(
    public readonly a: string,
    public readonly b: number,
    public readonly c: boolean
  ) {}
}

export type LazyType<T> = T;

@Based
class Named {
  constructor(
    @DecoFn(Some) private param: Some,
    @DecoFn private param2: Some,
  ) {}

  @Based()
  methodName(
    @Args() args: Args,
    @Context() context: Context,
    @DecoFn(Xyz) xyz: any
  ): void {}

  @Based()
  static staticMethod(
    arg1: string,
    arg2: number,
    arg3: boolean
  ) : number { return 0; }

  @Based()
  static staticProperty: number = 0;
  @Based()
  memberProperty: string = "member";
  @Based()
  lazyProperty: LazyType<SomeClass> = new SomeClass("a", 1, true);

  @Based()
  destructuringMethod(
    { arg1, arg2 = 0, arg3, arg4 }: { arg1: string, arg2?: number, arg3: SomeClass[], arg4?: string }
  ) : string { return "success"; }

  @Based()
  async asyncMethod(
    { arg1 }: { arg1: string }
  ) : Promise<string> { return "success"; }

  @Based()
  arrayMethod(): SomeClass[] { return [new SomeClass("a", 1, true)]; }
}

function testFunction(
  {arg1, arg2 = 0, arg3}: { arg1: string, arg2?: number, arg3: SomeClass[] }): string { return "success"; }
