import { SSGQuery } from '@/src/graphql/client';
import { ProductDetailSelector, NewestProductSelector } from '@/src/graphql/selectors';
import { getCollections } from '@/src/graphql/sharedQueries';
import { ContextModel, makeStaticProps } from '@/src/lib/getStatic';
import { arrayToTree } from '@/src/util/arrayToTree';
import { SortOrder } from '@/src/zeus';

export const getStaticProps = async (context: ContextModel<{ slug?: string }>) => {
    const r = await makeStaticProps(['common'])(context);
    const language = r.props._nextI18Next?.initialLocale || 'en';
    const { slug } = context.params || {};
    const response =
        typeof slug === 'string'
            ? await SSGQuery(r.context)({
                  product: [{ slug }, ProductDetailSelector],
              })
            : null;
    if (!response?.product) return { notFound: true };

    const collections = await getCollections(r.context);
    const navigation = arrayToTree(collections);

    const newestProducts = await SSGQuery(r.context)({
        products: [{ options: { take: 10, sort: { createdAt: SortOrder.DESC } } }, { items: NewestProductSelector }],
    });

    const { optionGroups: _optionGroups, ...product } = response.product;

    // mapping option groups to match the color names <-> hex codes
    // const getFacetsValues = await storefrontApiQuery(language)({
    //     facets: [{ options: { filter: { name: { eq: 'color' } } } }, { items: { values: { name: true, code: true } } }],
    // });

    const optionGroups = _optionGroups.map(og => {
        return {
            ...og,
            options: og.options
                .sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))
                .map(o => {
                    // mapping option groups to match the color names <-> hex codes
                    // const name =
                    //     getFacetsValues.facets.items[0].values.find(v => v.name.toLowerCase() === o.code.toLowerCase())
                    //         ?.code || o.name;

                    const name =
                        notInDemoStore.find(v => v.name.toLowerCase() === o.code.toLowerCase())?.code || o.name;
                    return { ...o, name };
                }),
        };
    });
    const returnedStuff = {
        slug: context.params?.slug,
        product: {
            ...product,
            optionGroups,
        },
        collections,
        newestProducts,
        navigation,
        language,
        ...r.props,
    };

    return {
        props: returnedStuff,
        revalidate: process.env.NEXT_REVALIDATE ? parseInt(process.env.NEXT_REVALIDATE) : 10,
    };
};

//THIS IS NOT IN DEMO STORE - BUT MAKE SENSE TO KEEP IT LIKE THIS
const notInDemoStore = [
    { name: 'blue', code: '#0000FF' },
    { name: 'pink', code: '#FFC0CB' },
    { name: 'black', code: '#000000' },
    { name: 'gray', code: '#808080' },
    { name: 'brown', code: '#964B00' },
    { name: 'wood', code: '#A1662F' },
    { name: 'yellow', code: '#FFFF00' },
    { name: 'green', code: '#008000' },
    { name: 'white', code: '#FFFFFF' },
    { name: 'red', code: '#FF0000' },
    { name: 'mustard', code: '#FFDB58' },
    { name: 'mint', code: '#98FF98' },
    { name: 'pearl', code: '#FDEEF4' },
];
