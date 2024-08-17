"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {Checkbox} from "@/components/ui/checkbox";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {useState} from "react";
import {Separator} from "@/components/ui/separator";

const formSchema = z.object({
    players: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    entryFee: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    isFriday: z.boolean(),
    undefeatedPlayer: z.boolean(),
    prizesPlayer: z.coerce.number({invalid_type_error: 'Not a number'}).min(1),
    toCut: z.boolean()
})

interface Result {
    prizePlayer: number
    prize: number
    undefeatedPrize?: number
    toCut?: number
    fridayPool?: number
}

export function ProfileForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        mode: 'onBlur',
        resolver: zodResolver(formSchema),
        defaultValues: {
            entryFee: 50,
            isFriday: true,
            undefeatedPlayer: false,
            toCut: true,
        },
    })
    const [result, setResult] = useState<Result | null>()

    function onSubmit(values: z.infer<typeof formSchema>) {
        let prizePool = values.players * values.entryFee

        if(values.toCut) {
            prizePool = prizePool - values.entryFee - 50;
        }

        if(values.isFriday) {
            prizePool = prizePool * 0.9
        }

        const result: Result = {
            undefeatedPrize: values.undefeatedPlayer ? prizePool * 0.35 : undefined,
            prize: (values.undefeatedPlayer ? prizePool * (1 - 0.35) : prizePool) / (values.prizesPlayer - (values.undefeatedPlayer ? 1 : 0)),
            prizePlayer: (values.prizesPlayer - (values.undefeatedPlayer ? 1 : 0)),
            toCut: values.toCut ? 50 : undefined,
            fridayPool: values.isFriday ? prizePool * 0.1 : undefined,
        }

        setResult(result)
    }

    return (
        <div className="p-8">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                Prize calculator
            </h1>
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
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>This includes the tournament organizer</FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="prizesPlayer"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Players in prizes</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is usually players who went X-1 or better
                                </FormDescription>
                                <FormMessage/>
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
                                        Distributes 35% of the prize pool towards a single player
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                    <Separator/>
                    <h3 className="mt-2 scroll-m-20 text-2xl font-semibold tracking-tight">
                        Additional settings
                    </h3>
                    <FormField
                        control={form.control}
                        name="entryFee"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Entry fee (kr.)</FormLabel>
                                <FormControl>
                                    <Input placeholder="50" {...field} />
                                </FormControl>
                                <FormMessage/>
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
                                    <FormLabel>
                                        Friday tournament
                                    </FormLabel>
                                    <FormDescription>
                                        10% of the prize pool from a friday tournament goes towards a bigger tournament
                                    </FormDescription>
                                </div>
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
                                        Apply TO cut?
                                    </FormLabel>
                                    <FormDescription>
                                        This removes the entry fee + a 50 kr. cut from the prize pool.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button type="submit" disabled={!form.formState.isValid}>Submit</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Results</DialogTitle>
                                <DialogDescription>
                                    {result?.undefeatedPrize &&
                                        <p>X-0 prize: <b>{Math.floor(result.undefeatedPrize)} kr.</b></p>}
                                    {result?.prize && <p>Default
                                        prize: <b>{Math.floor(result.prize)} kr.</b> to <b>{result?.prizePlayer}</b> players.
                                    </p>}
                                    {result?.toCut &&
                                        <p>Tournament organizer compensation: <b>{Math.floor(result.toCut)} kr.</b></p>}
                                    {result?.fridayPool && <p>Prize money towards bigger
                                        tournament: <b>{Math.floor(result.fridayPool)} kr.</b></p>}
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>

                </form>
            </Form></div>
            <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How is the prize calculated?</AccordionTrigger>
                    <AccordionContent>
                        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
                            The total prize pool can be calculated in the following order:
                        </h3>
                        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
                            <li>Initial prize pool being: <b>total players * entry fee</b></li>
                            <li>If tournament organizer compensation is given, the <b>entry fee + 50 kr is
                                subtracted</b> from
                                the
                                prize pool.
                            </li>
                            <li>If it&apos;s a friday tournament, <b>10% is subtracted</b> from the prize pool.</li>
                            <li>If there&apos;s no undefeated players:
                                <ul className="ml-6 list-disc [&>li]:mt-2">
                                    <li>Simply divide the prize pool <b>equally amongst the number of players</b> in
                                        prizes
                                    </li>
                                    <li>Otherwise subtract <b>35% of the prize pool</b> that goes towards the X-0, then
                                        divide
                                        the
                                        remaining
                                        with the amount of the other players in prizes.
                                    </li>
                                </ul>
                            </li>
                        </ol>
                        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
                            Note of weird cases:
                        </h3>

                        <p className="leading-7 [&:not(:first-child)]:mt-6">In the rare case of only 2 players being in
                            the prize pool, where one is X-0, the
                            35% rule
                            doesn&apos;t make sense. Find a better distribution yourself, such as 60/40.</p>


                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

    )
}
