import {
    GetStaticPaths,
    GetStaticProps,
    InferGetStaticPropsType,
    NextPage,
} from "next";

import { client } from "../libs/client";
import type { Blog } from "@/types/blog";

import Seo from "../components/Seo"
import Ogp from "../components/Ogp"
import Title from "../components/Title"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faTags } from "@fortawesome/free-solid-svg-icons";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";

import cheerio from 'cheerio';
import hljs from 'highlight.js'
import 'highlight.js/styles/night-owl.css';

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const data = await client.get({ endpoint: "blog" });

    const paths = data.contents.map((content: Blog) => `/blog/${content.id}`);
    return { paths, fallback: false };
};

type Props = {
    blog: Blog;
    highlightedBody: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const id = context.params?.id;
    const data = await client.get({ endpoint: "blog", contentId: id });

    const $ = cheerio.load(data.content);
    $('pre code').each((_, elm) => {
        const result = hljs.highlightAuto($(elm).text());
        $(elm).html(result.value);
        $(elm).addClass('hljs');
    });

    return {
        props: {
            blog: data,
            highlightedBody: $.html()
        },
    };
};

const BlogId: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
    blog, highlightedBody
}: Props) => {
    return (
        <main>
            <Ogp title={blog.title} />
            <Title title={blog.title + " - ブログ"} />
            <Seo title={blog.title + " - ブログ"} />
            <div className="text-center">
                <span className="fs-2">{blog.title}</span>
                <div>
                    <span className="d-inline" suppressHydrationWarning><FontAwesomeIcon icon={faCalendar} width={20} />{new Date(blog.updated).toLocaleDateString("ja-JP")}</span>&nbsp;
                    <div className="d-inline" suppressHydrationWarning><FontAwesomeIcon icon={faTags} width={20} />
                        {
                            blog.tags.map((tag) => (
                                <span key={tag.id} className="badge text-bg-success">{tag.name}</span>
                            ))
                        }

                    </div>
                </div>
            </div>
            <div className="mt-3" dangerouslySetInnerHTML={{ __html: highlightedBody }}></div>
        </main>
    );
}

export default BlogId