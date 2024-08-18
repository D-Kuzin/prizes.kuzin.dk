'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

import {Button} from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {ModeToggle} from '@/components/ui/mode-toggle';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {useEffect, useState} from 'react';
import {Trophy, Medal, HandCoins, PiggyBank} from 'lucide-react';

const formSchema = z.object({
    players: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    entryFee: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    isFriday: z.boolean(),
    undefeatedPlayer: z.boolean(),
    prizesPlayer: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    toCut: z.boolean(),
    top8: z
        .object({
        first: z.coerce.number({invalid_type_error: 'Not a number'}).min(0).max(100),
        second: z.coerce.number({invalid_type_error: 'Not a number'}).min(0).max(100),
        third: z.coerce.number({invalid_type_error: 'Not a number'}).min(0).max(100),
        fifth: z.coerce.number({invalid_type_error: 'Not a number'}).min(0).max(100),
        })
        .refine((data) => data.first + data.second + data.third * 2 + data.fifth * 4 === 100, {
            message: "Values doesn't add up to 100",
            path: ["top8.first"], // path of error
        }),
    mode: z.string(),
});

interface X1Structure {
    prizePlayer: number;
    prize: number;
    undefeatedPrize?: number;
    mode: 'x1';
}

interface Top8Structure {
    first: number;
    second: number;
    third: number;
    fifth: number;
    mode: 'top8';
}

interface Result {
    structure: X1Structure | Top8Structure;
    toCut?: number;
    fridayPool?: number;
}

const THIRD_PLACE_RATIO = 0.176;
const FIFTH_PLACE_RATIO = 0.088;

export function ProfileForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        mode: 'onChange',
        resolver: zodResolver(formSchema),
        defaultValues: {
            entryFee: 50,
            isFriday: true,
            undefeatedPlayer: false,
            prizesPlayer: 1,
            toCut: true,
            top8: {
                first: 32,
                second: 20,
                third: 12,
                fifth: 6,
            },
            mode: 'x1',
        },
    });


    const [result, setResult] = useState<Result | null>();


    const updateRatio = (top8firstString: string) => {
        const top8first = parseInt(top8firstString);

        form.setValue('top8.first', top8first);

        if (!top8first) return;

        const thirdPlacePercantage = Math.round((100 - top8first) * THIRD_PLACE_RATIO);
        const fifthPlacePercantage = Math.round((100 - top8first) * FIFTH_PLACE_RATIO);

        form.setValue('top8.third', thirdPlacePercantage);
        form.setValue('top8.fifth', fifthPlacePercantage);
        form.setValue(
            'top8.second',
            100 - top8first - thirdPlacePercantage * 2 - fifthPlacePercantage * 4,
        );
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        let prizePool = values.players * values.entryFee;

        if (values.toCut) {
            prizePool = prizePool - values.entryFee - 50;
        }

        if (values.isFriday) {
            prizePool = prizePool * 0.9;
        }

        if (values.mode === 'x1') {
            const undefeatedCut =
                values.prizesPlayer === 1
                    ? 1.0
                    : values.prizesPlayer === 2
                      ? 0.6
                      : values.prizesPlayer === 3
                        ? 0.4
                        : 0.35;

            const result: Result = {
                structure: {
                    mode: 'x1',
                    undefeatedPrize: values.undefeatedPlayer
                        ? prizePool * undefeatedCut
                        : undefined,
                    prize:
                        (values.undefeatedPlayer ? prizePool * (1 - undefeatedCut) : prizePool) /
                        (values.prizesPlayer - (values.undefeatedPlayer ? 1 : 0)),
                    prizePlayer: values.prizesPlayer - (values.undefeatedPlayer ? 1 : 0),
                },
                toCut: values.toCut ? 50 : undefined,
                fridayPool: values.isFriday ? prizePool * 0.1 : undefined,
            };

            setResult(result);
        } else {
            const first = Math.floor(values.top8.first / 100 * prizePool );
            const second = Math.floor(values.top8.second / 100 * prizePool);
            const third = Math.floor(values.top8.third / 100 * prizePool);
            const fifth = Math.floor(values.top8.fifth / 100 * prizePool);

            const result: Result = {
                structure: {
                    mode: 'top8',
                    first,
                    second,
                    third,
                    fifth,
                },
                toCut: values.toCut ? 50 : undefined,
                fridayPool: values.isFriday ? prizePool * 0.1 : undefined,
            };

            setResult(result);
        }
    }

    return (
        <div className="p-8">
            <div className="flex flex-row justify-between">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Prize calculator
                </h1>
                <ModeToggle />
            </div>
            <p className="leading-7 [&:not(:first-child)]:my-6">
                A simple calculator for prizes for tournaments at Faraos Cigarer
            </p>
            <div className="rounded-md border p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <h3 className="mt-2 scroll-m-20 text-2xl font-semibold tracking-tight">
                            Tournament results
                        </h3>
                        <FormField
                            control={form.control}
                            name="players"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Total players</FormLabel>
                                    <FormControl>
                                        <Input type={'number'} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This includes the tournament organizer
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isFriday"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Friday tournament</FormLabel>
                                        <FormDescription>
                                            10% of the prize pool from a friday
                                            tournament goes towards a bigger
                                            tournament
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mode"
                            render={({field}) => (
                                <Tabs
                                    value={field.value}
                                    onValueChange={value => field.onChange(value)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="x1">X-1 or better</TabsTrigger>
                                        <TabsTrigger value="top8">Top 8</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="x1" className="space-y-8">
                                        <FormField
                                            control={form.control}
                                            name="prizesPlayer"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Players in prizes</FormLabel>
                                                    <FormControl>
                                                        <Input type={'number'} {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        This is usually players who went X-1 or
                                                        better
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="undefeatedPlayer"
                                            render={({field}) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            X-0 player amongst winners
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Distributes 60%, 40% or 35% of the prize
                                                            pool towards a single player when
                                                            there&apos;s 2, 3 or 4+ players in the
                                                            prize pool.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>
                                    <TabsContent value="top8" className="space-y-8">
                                        <FormField
                                            control={form.control}
                                            name="top8.first"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>First place (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={event =>
                                                                updateRatio(
                                                                    event.currentTarget.value,
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="top8.second"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Second place (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="top8.third"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>3-4 place (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="top8.fifth"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>5-8 place (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormMessage>
                                            {form.formState.errors.top8?.message}
                                        </FormMessage>
                                    </TabsContent>
                                </Tabs>
                            )}
                        />

                        <Accordion type="single" collapsible className="w-full mt-4">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Additional settings</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-8 p-4">
                                        <FormField
                                            control={form.control}
                                            name="entryFee"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Entry fee (kr.)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="50"
                                                            type={'number'}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="toCut"
                                            render={({field}) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            Tournament organization compensation
                                                        </FormLabel>
                                                        <FormDescription>
                                                            This removes the entry fee + a 50 kr.
                                                            cut from the prize pool.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="submit" disabled={!form.formState.isValid}>
                                    Submit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Results</DialogTitle>
                                    <DialogDescription className="space-y-4 pt-4">
                                        {result?.structure.mode === 'x1' ?
                                            <>
                                                {result?.structure.undefeatedPrize && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                Undefeated prize money
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <Trophy />
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    1 player
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                            <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.undefeatedPrize)} kr.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {result?.structure.prize && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                Prize money
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <Medal />
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    {result?.structure.prizePlayer} player(s)
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                            <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.prize)} kr.
                                                                <p className="text-xs text-muted-foreground">
                                                                    each
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                            :
                                            <>
                                                {result?.structure.first && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                Winner
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <Trophy/>
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    1 player
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                        <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.first)} kr.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {result?.structure.second && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                Runner-up
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <Medal/>
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    1 player
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                        <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.second)} kr.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {result?.structure.third && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                3rd-4th place
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    2 players
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                            <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.third)} kr.
                                                                <p className="text-xs text-muted-foreground">
                                                                    each
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {result?.structure.fifth && (
                                                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                            <h3 className="tracking-tight text-sm font-medium">
                                                                5th-8th place
                                                            </h3>
                                                            <div className="flex flex-row gap-2 items-center">
                                                                <h3 className="tracking-tight text-sm font-bold">
                                                                    4 players
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 pt-0">
                                                            <div className="text-2xl font-bold">
                                                                {Math.floor(result.structure.fifth)} kr.
                                                                <p className="text-xs text-muted-foreground">
                                                                    each
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        }

                                        {result?.fridayPool && (
                                            <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <h3 className="tracking-tight text-sm font-medium">
                                                        Prize money towards bigger tournament
                                                    </h3>
                                                    <div className="flex flex-row gap-2 items-center">
                                                        <PiggyBank />
                                                    </div>
                                                </div>
                                                <div className="p-6 pt-0">
                                                    <div className="text-2xl font-bold">
                                                        +{Math.floor(result.fridayPool)} kr.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {result?.toCut && (
                                            <div className="rounded-xl border bg-card text-card-foreground shadow">
                                                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <h3 className="tracking-tight text-sm font-medium">
                                                        Tournament organizer compensation
                                                    </h3>
                                                    <div className="flex flex-row gap-2 items-center">
                                                        <HandCoins />
                                                    </div>
                                                </div>
                                                <div className="p-6 pt-0">
                                                    <div className="text-2xl font-bold">
                                                        {Math.floor(result.toCut)} kr.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </form>
                </Form>
            </div>
            <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How is the prize calculated?</AccordionTrigger>
                    <AccordionContent>
                        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
                            The total prize pool can be calculated in the following order:
                        </h3>
                        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
                            <li>
                                Initial prize pool being: <b>total players * entry fee</b>
                            </li>
                            <li>
                                If tournament organizer compensation is given, the{' '}
                                <b>entry fee + 50 kr is subtracted</b> from the prize pool.
                            </li>
                            <li>
                                If it&apos;s a friday tournament, <b>10% is subtracted</b> from the
                                prize pool.
                            </li>
                            <li>
                                If there&apos;s no undefeated players:
                                <ul className="ml-6 list-disc [&>li]:mt-2">
                                    <li>
                                        Simply divide the prize pool{' '}
                                        <b>equally amongst the number of players</b> in prizes
                                    </li>
                                    <li>
                                        Otherwise subtract{' '}
                                        <b>
                                            60%, 40%, 35% of the prize pool that goes towards the
                                            X-0 - divide the remaining towards the 2, 3 or 4+ other
                                            players
                                        </b>{' '}
                                        in prizes.
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
